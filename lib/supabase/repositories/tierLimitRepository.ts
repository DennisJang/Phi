import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database';
import type { TierLimit, TierLimitResource } from '@/types/tierLimit';
import type { TierLimitRepository } from '@/lib/repository/tierLimits';

type TierLimitRow = Database['public']['Tables']['tier_limits']['Row'];

const TIER_LIMIT_COLUMNS = 'tier, resource, limit_value, updated_at';

function rowToTierLimit(row: TierLimitRow): TierLimit {
  return {
    tier: row.tier,
    resource: row.resource as TierLimitResource | string,
    limitValue: row.limit_value,
    updatedAt: row.updated_at,
  };
}

export function createTierLimitRepository(
  supabase: SupabaseClient<Database>,
): TierLimitRepository {
  return {
    async findByTier(tier: string): Promise<TierLimit[]> {
      const { data, error } = await supabase
        .from('tier_limits')
        .select(TIER_LIMIT_COLUMNS)
        .eq('tier', tier)
        .returns<TierLimitRow[]>();

      if (error) {
        throw new Error(`[tierLimitRepository.findByTier] ${error.message}`);
      }
      return (data ?? []).map(rowToTierLimit);
    },

    async findOne(tier: string, resource: string): Promise<TierLimit | null> {
      const { data, error } = await supabase
        .from('tier_limits')
        .select(TIER_LIMIT_COLUMNS)
        .eq('tier', tier)
        .eq('resource', resource)
        .returns<TierLimitRow[]>()
        .maybeSingle();

      if (error) {
        throw new Error(`[tierLimitRepository.findOne] ${error.message}`);
      }
      return data ? rowToTierLimit(data) : null;
    },
  };
}
