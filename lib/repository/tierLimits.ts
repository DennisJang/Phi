import type { TierLimit } from '@/types/tierLimit';

/**
 * TierLimitRepository — domain interface for the `tier_limits`
 * table.
 *
 * PR2 declares only the shape; the Supabase adapter and wiring land
 * in PR3 alongside the quota helper.
 */
export interface TierLimitRepository {
  findByTier(tier: string): Promise<TierLimit[]>;
  findOne(tier: string, resource: string): Promise<TierLimit | null>;
}
