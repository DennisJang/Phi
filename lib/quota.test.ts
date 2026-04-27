import { describe, it, expect, vi } from 'vitest';
import { getQuotaLimit, isUnlimited, QuotaLookupError } from './quota';
import type { TierLimitRepository } from './repository/tierLimits';
import type { TierLimit } from '@/types/tierLimit';

function makeRepo(rows: TierLimit[]): TierLimitRepository {
  const findOne = vi.fn(async (tier: string, resource: string) => {
    return rows.find((r) => r.tier === tier && r.resource === resource) ?? null;
  });
  return {
    findByTier: vi.fn(async () => []),
    findOne,
  };
}

const ROW = (
  tier: string,
  resource: string,
  limitValue: number,
): TierLimit => ({
  tier,
  resource,
  limitValue,
  updatedAt: '2026-04-26T00:00:00.000Z',
});

describe('getQuotaLimit', () => {
  it('returns the integer cap when limit_value is positive', async () => {
    const repo = makeRepo([ROW('free', 'books', 30)]);
    const lookup = await getQuotaLimit('free', 'books', repo);
    expect(lookup.limit).toBe(30);
    expect(isUnlimited(lookup)).toBe(false);
  });

  it('maps limit_value === -1 to Infinity', async () => {
    const repo = makeRepo([ROW('pro', 'books', -1)]);
    const lookup = await getQuotaLimit('pro', 'books', repo);
    expect(lookup.limit).toBe(Number.POSITIVE_INFINITY);
    expect(isUnlimited(lookup)).toBe(true);
  });

  it('handles the shelf_affinities resource in the same shape', async () => {
    const repo = makeRepo([
      ROW('free', 'shelf_affinities', 5),
      ROW('standard', 'shelf_affinities', -1),
    ]);

    const free = await getQuotaLimit('free', 'shelf_affinities', repo);
    expect(free.limit).toBe(5);

    const standard = await getQuotaLimit('standard', 'shelf_affinities', repo);
    expect(isUnlimited(standard)).toBe(true);
  });

  it('exposes the raw row in lookup.source', async () => {
    const repo = makeRepo([ROW('free', 'books', 30)]);
    const lookup = await getQuotaLimit('free', 'books', repo);
    expect(lookup.source).toEqual({
      tier: 'free',
      resource: 'books',
      limitValue: 30,
    });
  });

  it('throws QuotaLookupError when the row is missing', async () => {
    const repo = makeRepo([]);
    await expect(getQuotaLimit('free', 'books', repo)).rejects.toBeInstanceOf(
      QuotaLookupError,
    );

    try {
      await getQuotaLimit('free', 'books', repo);
    } catch (err) {
      expect(err).toBeInstanceOf(QuotaLookupError);
      expect((err as QuotaLookupError).tier).toBe('free');
      expect((err as QuotaLookupError).resource).toBe('books');
      expect((err as QuotaLookupError).name).toBe('QuotaLookupError');
    }
  });

  it('passes (tier, resource) through to repo.findOne', async () => {
    const repo = makeRepo([ROW('free', 'books', 30)]);
    await getQuotaLimit('free', 'books', repo);
    expect(repo.findOne).toHaveBeenCalledWith('free', 'books');
  });
});

describe('isUnlimited', () => {
  it('is true only for non-finite limits', () => {
    expect(isUnlimited({ limit: Number.POSITIVE_INFINITY, source: {} as never })).toBe(
      true,
    );
    expect(isUnlimited({ limit: 0, source: {} as never })).toBe(false);
    expect(isUnlimited({ limit: 1, source: {} as never })).toBe(false);
    expect(isUnlimited({ limit: 1_000_000, source: {} as never })).toBe(false);
  });
});
