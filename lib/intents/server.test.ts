import { describe, it, expect, vi, beforeEach } from 'vitest';
import { readFileSync } from 'node:fs';
import path from 'node:path';

// server-only's actual export throws when bundled into anything that
// resolves it as a client module — vitest's resolver triggers that
// throw even in a Node test run, so stub it out.
vi.mock('server-only', () => ({}));

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
}));
vi.mock('@/lib/repository/server', () => ({
  createServerRepositories: vi.fn(),
}));
vi.mock('@/lib/repository/admin', () => ({
  createAdminRepositories: vi.fn(),
}));

import { createClient } from '@/lib/supabase/server';
import { createServerRepositories } from '@/lib/repository/server';
import { createAdminRepositories } from '@/lib/repository/admin';
import { buildIntentServerContext, IntentAuthError } from './server';
import { buildIntentBatchContext } from './server-batch';

function fakeAuthClient(
  result: {
    user?: { id: string } | null;
    error?: { message: string } | null;
  },
) {
  return {
    auth: {
      getUser: vi.fn().mockResolvedValue({
        data: { user: result.user ?? null },
        error: result.error ?? null,
      }),
    },
  };
}

beforeEach(() => {
  vi.mocked(createClient).mockReset();
  vi.mocked(createServerRepositories).mockReset();
  vi.mocked(createAdminRepositories).mockReset();
});

describe('buildIntentServerContext', () => {
  it('returns the actor id, repo bundle, and trigger source on success', async () => {
    const mockRepos = { books: {} } as never;
    vi.mocked(createClient).mockResolvedValue(
      fakeAuthClient({ user: { id: 'user-123' } }) as never,
    );
    vi.mocked(createServerRepositories).mockResolvedValue(mockRepos);

    const ctx = await buildIntentServerContext('bookshelf:add');
    expect(ctx.actorId).toBe('user-123');
    expect(ctx.repos).toBe(mockRepos);
    expect(ctx.triggerSource).toBe('bookshelf:add');
  });

  it('defaults trigger source to null when omitted', async () => {
    vi.mocked(createClient).mockResolvedValue(
      fakeAuthClient({ user: { id: 'user-123' } }) as never,
    );
    vi.mocked(createServerRepositories).mockResolvedValue({} as never);

    const ctx = await buildIntentServerContext();
    expect(ctx.triggerSource).toBeNull();
  });

  it('throws IntentAuthError when auth.getUser returns no user', async () => {
    vi.mocked(createClient).mockResolvedValue(
      fakeAuthClient({ user: null }) as never,
    );

    await expect(buildIntentServerContext()).rejects.toBeInstanceOf(
      IntentAuthError,
    );
  });

  it('throws IntentAuthError when auth.getUser surfaces an error', async () => {
    vi.mocked(createClient).mockResolvedValue(
      fakeAuthClient({
        user: null,
        error: { message: 'jwt expired' },
      }) as never,
    );

    try {
      await buildIntentServerContext();
      throw new Error('expected throw');
    } catch (err) {
      expect(err).toBeInstanceOf(IntentAuthError);
      expect((err as Error).message).toContain('jwt expired');
    }
  });
});

describe('buildIntentBatchContext', () => {
  it('builds a system-driven context with admin repos and null actor', () => {
    const mockAdminRepos = { books: {} } as never;
    vi.mocked(createAdminRepositories).mockReturnValue(mockAdminRepos);

    const ctx = buildIntentBatchContext('cron');
    expect(ctx.actorId).toBeNull();
    expect(ctx.triggerSource).toBe('cron');
    expect(ctx.repos).toBe(mockAdminRepos);
  });

  it('accepts an explicit actor for manual_admin trigger', () => {
    vi.mocked(createAdminRepositories).mockReturnValue({} as never);
    const ctx = buildIntentBatchContext('manual_admin', 'admin-user-1');
    expect(ctx.actorId).toBe('admin-user-1');
    expect(ctx.triggerSource).toBe('manual_admin');
  });
});

describe("'server-only' import sanity", () => {
  it.each([
    ['lib/intents/server.ts'],
    ['lib/intents/server-batch.ts'],
  ])('%s starts with the server-only import', (relativePath) => {
    const source = readFileSync(
      path.resolve(process.cwd(), relativePath),
      'utf-8',
    );
    expect(source).toMatch(/import 'server-only';/);
  });
});
