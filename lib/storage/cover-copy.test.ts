import { describe, it, expect, vi } from 'vitest';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database';
import {
  COVER_BUCKET,
  countCoverReferences,
  coverStoragePath,
} from './cover-copy';

interface FakeSupabase {
  client: SupabaseClient<Database>;
  spies: {
    from: ReturnType<typeof vi.fn>;
    select: ReturnType<typeof vi.fn>;
    eq: ReturnType<typeof vi.fn>;
    is: ReturnType<typeof vi.fn>;
  };
}

function makeFakeSupabase(
  rows: Array<{ user_id: string }>,
  error: { message: string } | null = null,
): FakeSupabase {
  const is = vi.fn().mockResolvedValue({ data: rows, error });
  const eq = vi.fn(() => ({ is }));
  const select = vi.fn(() => ({ eq }));
  const from = vi.fn(() => ({ select }));
  return {
    client: { from } as unknown as SupabaseClient<Database>,
    spies: { from, select, eq, is },
  };
}

describe('coverStoragePath', () => {
  it('joins userId and sha1 with the .webp suffix', () => {
    expect(coverStoragePath('user1', 'abc123')).toBe('user1/abc123.webp');
  });
});

describe('COVER_BUCKET', () => {
  it('is the literal "covers"', () => {
    expect(COVER_BUCKET).toBe('covers');
  });
});

describe('countCoverReferences', () => {
  it('returns zero counts when no live row references the sha1', async () => {
    const { client } = makeFakeSupabase([]);
    const result = await countCoverReferences('sha1-empty', client);
    expect(result).toEqual({ sha1: 'sha1-empty', count: 0, ownerCount: 0 });
  });

  it('reports count=1 / ownerCount=1 for a single owner reference', async () => {
    const { client } = makeFakeSupabase([{ user_id: 'u1' }]);
    const result = await countCoverReferences('sha1-solo', client);
    expect(result).toEqual({ sha1: 'sha1-solo', count: 1, ownerCount: 1 });
  });

  it('counts all rows but distincts owners (same user, multiple books)', async () => {
    const rows = [{ user_id: 'u1' }, { user_id: 'u1' }, { user_id: 'u1' }];
    const { client } = makeFakeSupabase(rows);
    const result = await countCoverReferences('sha1-dup', client);
    expect(result.count).toBe(3);
    expect(result.ownerCount).toBe(1);
  });

  it('counts cross-user shares as multiple owners', async () => {
    const rows = [
      { user_id: 'u1' },
      { user_id: 'u2' },
      { user_id: 'u3' },
    ];
    const { client } = makeFakeSupabase(rows);
    const result = await countCoverReferences('sha1-shared', client);
    expect(result.count).toBe(3);
    expect(result.ownerCount).toBe(3);
  });

  it('filters by sha1, the books table, and deleted_at IS NULL', async () => {
    const fake = makeFakeSupabase([{ user_id: 'u1' }]);
    await countCoverReferences('sha1-filter', fake.client);

    expect(fake.spies.from).toHaveBeenCalledWith('books');
    expect(fake.spies.select).toHaveBeenCalledWith('user_id');
    expect(fake.spies.eq).toHaveBeenCalledWith('cover_sha1', 'sha1-filter');
    expect(fake.spies.is).toHaveBeenCalledWith('deleted_at', null);
  });

  it('throws when the underlying query errors', async () => {
    const { client } = makeFakeSupabase([], { message: 'rls denied' });
    await expect(countCoverReferences('sha1-err', client)).rejects.toThrow(
      /\[cover-copy\.countCoverReferences\] rls denied/,
    );
  });
});
