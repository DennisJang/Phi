import { describe, it, expect, vi } from 'vitest';
import {
  ALLOWED_TRANSITIONS,
  canTransition,
  isTerminal,
  InvalidTransitionError,
  markRunning,
  markSucceeded,
  markFailed,
} from './state-machine';
import type { Intent, IntentState } from '@/types/intent';
import type { IntentRepository } from '@/lib/repository/intents';

const STATES: IntentState[] = ['pending', 'running', 'succeeded', 'failed'];

function makeIntent(state: IntentState, id = 'intent-1'): Intent {
  return {
    id,
    kind: 'add_book',
    actorId: 'user-1',
    idempotencyKey: 'idem-1',
    triggerSource: null,
    state,
    params: {},
    progress: {},
    result: null,
    error: null,
    retryCount: 0,
    nextRetryAt: null,
    startedAt: '2026-04-27T00:00:00.000Z',
    updatedAt: '2026-04-27T00:00:00.000Z',
    completedAt: null,
  };
}

function makeRepo(initial: Intent): {
  repo: IntentRepository;
  spies: {
    findById: ReturnType<typeof vi.fn>;
    transitionState: ReturnType<typeof vi.fn>;
    completeWithResult: ReturnType<typeof vi.fn>;
    completeWithError: ReturnType<typeof vi.fn>;
  };
} {
  const findById = vi.fn(async (id: string) =>
    id === initial.id ? initial : null,
  );
  const transitionState = vi.fn(async (id: string, state: IntentState) => ({
    ...initial,
    id,
    state,
  }));
  const completeWithResult = vi.fn(
    async (id: string, result: Record<string, unknown>) => ({
      ...initial,
      id,
      state: 'succeeded' as IntentState,
      result,
    }),
  );
  const completeWithError = vi.fn(
    async (id: string, error: Record<string, unknown>) => ({
      ...initial,
      id,
      state: 'failed' as IntentState,
      error,
    }),
  );
  return {
    repo: {
      create: vi.fn(),
      findById,
      findByIdempotencyKey: vi.fn(),
      transitionState,
      completeWithResult,
      completeWithError,
    },
    spies: { findById, transitionState, completeWithResult, completeWithError },
  };
}

describe('ALLOWED_TRANSITIONS', () => {
  it('matches the DB CHECK plus the linear pending → running → terminal flow', () => {
    expect(ALLOWED_TRANSITIONS.pending).toEqual(['running']);
    expect(ALLOWED_TRANSITIONS.running).toEqual(['succeeded', 'failed']);
    expect(ALLOWED_TRANSITIONS.succeeded).toEqual([]);
    expect(ALLOWED_TRANSITIONS.failed).toEqual([]);
  });
});

describe('canTransition', () => {
  it.each<[IntentState, IntentState, boolean]>([
    ['pending', 'running', true],
    ['pending', 'succeeded', false],
    ['pending', 'failed', false],
    ['running', 'succeeded', true],
    ['running', 'failed', true],
    ['running', 'pending', false],
    ['succeeded', 'failed', false],
    ['succeeded', 'running', false],
    ['failed', 'succeeded', false],
    ['failed', 'pending', false],
  ])('%s → %s = %s', (from, to, expected) => {
    expect(canTransition(from, to)).toBe(expected);
  });
});

describe('isTerminal', () => {
  it.each<[IntentState, boolean]>([
    ['pending', false],
    ['running', false],
    ['succeeded', true],
    ['failed', true],
  ])('isTerminal(%s) = %s', (state, expected) => {
    expect(isTerminal(state)).toBe(expected);
    // Invariant: terminal ↔ no outbound transitions.
    expect(ALLOWED_TRANSITIONS[state].length === 0).toBe(expected);
  });

  it('covers every state', () => {
    expect(STATES.every((s) => typeof isTerminal(s) === 'boolean')).toBe(true);
  });
});

describe('markRunning', () => {
  it('transitions a pending intent to running via the repo', async () => {
    const { repo, spies } = makeRepo(makeIntent('pending'));
    const next = await markRunning('intent-1', repo);
    expect(spies.findById).toHaveBeenCalledWith('intent-1');
    expect(spies.transitionState).toHaveBeenCalledWith('intent-1', 'running');
    expect(next.state).toBe('running');
  });

  it('throws InvalidTransitionError when current state is not pending', async () => {
    const { repo } = makeRepo(makeIntent('succeeded'));
    await expect(markRunning('intent-1', repo)).rejects.toBeInstanceOf(
      InvalidTransitionError,
    );
  });

  it('throws when the intent is missing', async () => {
    const { repo } = makeRepo(makeIntent('pending', 'other-id'));
    await expect(markRunning('missing-id', repo)).rejects.toThrow(/not found/);
  });
});

describe('markSucceeded', () => {
  it('transitions a running intent and persists the result', async () => {
    const { repo, spies } = makeRepo(makeIntent('running'));
    const next = await markSucceeded('intent-1', { ok: 1 }, repo);
    expect(spies.completeWithResult).toHaveBeenCalledWith('intent-1', {
      ok: 1,
    });
    expect(next.state).toBe('succeeded');
  });

  it('rejects when current state is not running', async () => {
    const { repo } = makeRepo(makeIntent('pending'));
    await expect(
      markSucceeded('intent-1', {}, repo),
    ).rejects.toBeInstanceOf(InvalidTransitionError);
  });
});

describe('markFailed', () => {
  it('transitions a running intent and persists the error', async () => {
    const { repo, spies } = makeRepo(makeIntent('running'));
    const next = await markFailed('intent-1', { kind: 'boom' }, repo);
    expect(spies.completeWithError).toHaveBeenCalledWith('intent-1', {
      kind: 'boom',
    });
    expect(next.state).toBe('failed');
  });

  it('rejects when current state is terminal', async () => {
    const { repo } = makeRepo(makeIntent('succeeded'));
    await expect(
      markFailed('intent-1', {}, repo),
    ).rejects.toBeInstanceOf(InvalidTransitionError);
  });
});
