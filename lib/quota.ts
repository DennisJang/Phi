/**
 * BS-29 quota helper.
 *
 * Looks up the per-(tier, resource) cap recorded in the `tier_limits`
 * table and surfaces it in a shape the intent layer can consume
 * directly. Rows holding `limit_value === -1` map to `Infinity`,
 * which makes the unlimited path indistinguishable from a high
 * integer cap at the call site.
 *
 * The Phi 3.0 "본체 = 무료" philosophy treats every Phase 1-2 row as
 * a freedom-locked candidate (`-1` across the board). Activation is
 * a strategist DB decision, not a code change — this helper is
 * generic enough to span both states without modification.
 */

import type { TierLimitRepository } from '@/lib/repository/tierLimits';

export type QuotaResource = 'books' | 'shelf_affinities' | string;

export interface QuotaLookupSource {
  tier: string;
  resource: string;
  /** The raw `limit_value` from `tier_limits`. `-1` means unlimited. */
  limitValue: number;
}

export interface QuotaLookup {
  /** `Infinity` when the row is `-1`, otherwise the integer cap. */
  limit: number;
  source: QuotaLookupSource;
}

export class QuotaLookupError extends Error {
  readonly tier: string;
  readonly resource: string;

  constructor(tier: string, resource: string, message: string) {
    super(message);
    this.name = 'QuotaLookupError';
    this.tier = tier;
    this.resource = resource;
  }
}

/**
 * Resolve the cap for `(tier, resource)`. Throws when no row exists —
 * an absent row indicates DB seed drift, not user-facing input, so we
 * surface it as an internal error rather than defaulting to a value.
 */
export async function getQuotaLimit(
  tier: string,
  resource: QuotaResource,
  repo: TierLimitRepository,
): Promise<QuotaLookup> {
  const row = await repo.findOne(tier, resource);
  if (!row) {
    throw new QuotaLookupError(
      tier,
      resource,
      `[quota] tier_limits row missing for (tier=${tier}, resource=${resource})`,
    );
  }

  const limit = row.limitValue === -1 ? Number.POSITIVE_INFINITY : row.limitValue;

  return {
    limit,
    source: {
      tier: row.tier,
      resource: row.resource,
      limitValue: row.limitValue,
    },
  };
}

/** Sugar for the call site — `if (!isUnlimited(lookup) && current >= lookup.limit) ...` */
export function isUnlimited(lookup: QuotaLookup): boolean {
  return !Number.isFinite(lookup.limit);
}
