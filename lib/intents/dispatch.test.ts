import { describe, it, expect, vi, beforeEach } from 'vitest';
import { z } from 'zod';

vi.mock('server-only', () => ({}));

import { dispatchIntent } from './dispatch';
import { _resetForTest, registerIntent } from './registry';
import type { IntentServerContext } from './server';
import type { Intent, IntentState } from '@/types/intent';
import type { IntentRepository } from '@/lib/repository/intents';

function makeIntent(overrides: Partial<Intent>): Intent {
  return {
    id: 'intent-1',
    kind: 'add_book',
    actorId: 'actor-1',
    idempotencyKey: 'idem-1',
    triggerSource: null,
    state: 'pending',
    params: {},
    progress: {},
    result: null,
    error: null,
    retryCount: 0,
    nextRetryAt: null,
    startedAt: '2026-04-27T00:00:00.000Z',
    updatedAt: '2026-04-27T00:00:00.000Z',
    completedAt: null,
    ...overrides,
  };
}

function makeCtx(
  repoOverrides: Partial<IntentRepository> = {},
  initial: { id?: string; state?: IntentState } = {},
): {
  ctx: IntentServerContext;
  repo: IntentRepository;
} {
  // Stateful mock: findById reflects the most recent transition, so
  // the state-machine guards inside markRunning/markSucceeded/markFailed
  // see a coherent timeline (pending → running → terminal) rather than
  // a frozen snapshot.
  let state: IntentState = initial.state ?? 'pending';
  let id: string = initial.id ?? 'intent-1';

  const repo: IntentRepository = {
    create: vi.fn(async (input) => {
      id = 'created-intent';
      state = input.state ?? 'pending';
      return makeIntent({
        id,
        state,
        kind: input.kind,
        actorId: input.actorId,
        idempotencyKey: input.idempotencyKey,
      });
    }),
    findById: vi.fn(async (lookupId: string) =>
      lookupId === id ? makeIntent({ id, state }) : null,
    ),
    findByIdempotencyKey: vi.fn(async () => null),
    transitionState: vi.fn(async (lookupId, newState) => {
      state = newState as IntentState;
      return makeIntent({ id: lookupId, state });
    }),
    completeWithResult: vi.fn(async (lookupId, result) => {
      state = 'succeeded';
      return makeIntent({ id: lookupId, state, result });
    }),
    completeWithError: vi.fn(async (lookupId, error) => {
      state = 'failed';
      return makeIntent({ id: lookupId, state, error });
    }),
    ...repoOverrides,
  };

  const ctx: IntentServerContext = {
    actorId: 'actor-1',
    triggerSource: null,
    repos: { intents: repo } as never,
  };

  return { ctx, repo };
}

beforeEach(() => {
  _resetForTest();
});

describe('envelope shape validation', () => {
  it('rejects a missing kind with envelope_invalid', async () => {
    const { ctx } = makeCtx();
    const result = await dispatchIntent({ idempotencyKey: 'k' }, ctx);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.kind).toBe('envelope_invalid');
  });

  it('rejects an empty idempotencyKey', async () => {
    const { ctx } = makeCtx();
    const result = await dispatchIntent(
      { kind: 'add_book', idempotencyKey: '', params: {} },
      ctx,
    );
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.kind).toBe('envelope_invalid');
  });

  it('rejects an entirely non-object envelope', async () => {
    const { ctx } = makeCtx();
    const result = await dispatchIntent('nope', ctx);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.kind).toBe('envelope_invalid');
  });
});

describe('handler lookup', () => {
  it('returns unknown_kind when the registry has no entry', async () => {
    const { ctx } = makeCtx();
    const result = await dispatchIntent(
      { kind: 'definitely_not_a_kind', idempotencyKey: 'k', params: {} },
      ctx,
    );
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.kind).toBe('unknown_kind');
  });

  it('returns not_implemented when a stub handler runs', async () => {
    const { ctx } = makeCtx();
    const result = await dispatchIntent(
      { kind: 'add_book', idempotencyKey: 'k', params: {} },
      ctx,
    );
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.kind).toBe('not_implemented');
  });
});

describe('params validation', () => {
  it('returns params_invalid when the kind-specific schema fails', async () => {
    registerIntent('add_book', {
      schema: z.object({ title: z.string() }),
      mode: 'sync',
      handler: async () => 'unused',
    });
    const { ctx } = makeCtx();
    const result = await dispatchIntent(
      { kind: 'add_book', idempotencyKey: 'k', params: { title: 42 } },
      ctx,
    );
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.kind).toBe('params_invalid');
  });
});

describe('sync mode', () => {
  it('runs the handler and returns the result with no intents row', async () => {
    registerIntent('move_section', {
      schema: z.object({ section: z.enum(['interested', 'owned', 'reading']) }),
      mode: 'sync',
      handler: async ({ section }) => ({ section }),
    });
    const { ctx, repo } = makeCtx();

    const result = await dispatchIntent(
      {
        kind: 'move_section',
        idempotencyKey: 'k1',
        params: { section: 'reading' },
      },
      ctx,
    );

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.intentId).toBeNull();
      expect(result.replayed).toBe(false);
      expect(result.result).toEqual({ section: 'reading' });
    }
    expect(repo.create).not.toHaveBeenCalled();
  });

  it('routes handler throws to internal', async () => {
    registerIntent('move_section', {
      schema: z.object({}),
      mode: 'sync',
      handler: async () => {
        throw new Error('boom');
      },
    });
    const { ctx } = makeCtx();
    const result = await dispatchIntent(
      { kind: 'move_section', idempotencyKey: 'k', params: {} },
      ctx,
    );
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.kind).toBe('internal');
      expect(result.error.message).toContain('boom');
    }
  });

  it('does not let a client-supplied actorId reach the handler', async () => {
    let received: IntentServerContext | undefined;
    registerIntent('move_section', {
      schema: z.object({}),
      mode: 'sync',
      handler: async (_p, c) => {
        received = c;
        return null;
      },
    });
    const { ctx } = makeCtx();
    await dispatchIntent(
      {
        kind: 'move_section',
        idempotencyKey: 'k',
        params: {},
        actorId: 'spoofed-actor',
      } as unknown,
      ctx,
    );
    expect(received?.actorId).toBe('actor-1');
  });
});

describe('async mode — fresh run', () => {
  it('creates an intent row, transitions running → succeeded, and returns the handler result', async () => {
    registerIntent('add_book', {
      schema: z.object({}),
      mode: 'async',
      handler: async () => ({ bookId: 'b1' }),
    });
    const { ctx, repo } = makeCtx();

    const result = await dispatchIntent(
      { kind: 'add_book', idempotencyKey: 'k1', params: {} },
      ctx,
    );

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.intentId).toBe('created-intent');
      expect(result.replayed).toBe(false);
      expect(result.result).toEqual({ bookId: 'b1' });
    }
    expect(repo.create).toHaveBeenCalledTimes(1);
    expect(repo.transitionState).toHaveBeenCalledWith(
      'created-intent',
      'running',
    );
    expect(repo.completeWithResult).toHaveBeenCalledWith('created-intent', {
      bookId: 'b1',
    });
  });

  it('marks the intent failed and returns internal when the handler throws', async () => {
    registerIntent('add_book', {
      schema: z.object({}),
      mode: 'async',
      handler: async () => {
        throw new Error('aladin down');
      },
    });
    const { ctx, repo } = makeCtx();

    const result = await dispatchIntent(
      { kind: 'add_book', idempotencyKey: 'k', params: {} },
      ctx,
    );

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.kind).toBe('internal');
      expect(result.error.message).toContain('aladin down');
    }
    expect(repo.completeWithError).toHaveBeenCalledTimes(1);
  });
});

describe('async mode — idempotency replay', () => {
  it('returns replayed=true for an inflight intent without re-running the handler', async () => {
    const handler = vi.fn(async () => 'should-not-run');
    registerIntent('add_book', {
      schema: z.object({}),
      mode: 'async',
      handler,
    });
    const inflight = makeIntent({
      id: 'existing',
      state: 'running',
      result: { partial: true },
    });
    const { ctx, repo } = makeCtx({
      findByIdempotencyKey: vi.fn(async () => inflight),
    });

    const result = await dispatchIntent(
      { kind: 'add_book', idempotencyKey: 'reused', params: {} },
      ctx,
    );

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.intentId).toBe('existing');
      expect(result.replayed).toBe(true);
      expect(result.result).toEqual({ partial: true });
    }
    expect(handler).not.toHaveBeenCalled();
    expect(repo.create).not.toHaveBeenCalled();
  });
});
