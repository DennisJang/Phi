/**
 * TierLimit — domain type for the `tier_limits` table.
 *
 * Per-(tier, resource) cap. Rows holding `limit_value === -1` are
 * read by `lib/intents/quota.ts` as Infinity (unlimited). Phi 3.0
 * "본체 = 무료" philosophy treats every Phase 1-2 row as a
 * freedom-locked candidate (-1 across the board); the cap helper
 * stays in the codebase regardless of activation state.
 */

export type TierLimitResource =
  | 'books'
  | 'bookmarks'
  | 'card_exports'
  | 'shelf_visits';

export interface TierLimit {
  tier: string;
  resource: TierLimitResource | string;
  limitValue: number;
  updatedAt: string;
}
