import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database';
import type { Profile, ProfileTier, ProfileTierSource } from '@/types/profile';
import type { ProfileRepository } from '@/lib/repository/profiles';

type ProfileRow = Database['public']['Tables']['profiles']['Row'];

const PROFILE_COLUMNS =
  'id, tier, tier_source, quota_bonus, referral_code, ' +
  'reading_streak_current, reading_streak_best, reading_streak_last_date';

function rowToProfile(row: ProfileRow): Profile {
  return {
    userId: row.id,
    tier: row.tier as ProfileTier,
    tierSource: row.tier_source as ProfileTierSource,
    quotaBonus: (row.quota_bonus ?? {}) as Record<string, unknown>,
    referralCode: row.referral_code,
    readingStreakCurrent: row.reading_streak_current,
    readingStreakLongest: row.reading_streak_best,
    readingStreakLastAt: row.reading_streak_last_date,
  };
}

export function createProfileRepository(
  supabase: SupabaseClient<Database>,
): ProfileRepository {
  return {
    async findByUserId(userId: string): Promise<Profile | null> {
      const { data, error } = await supabase
        .from('profiles')
        .select(PROFILE_COLUMNS)
        .eq('id', userId)
        .returns<ProfileRow[]>()
        .maybeSingle();

      if (error) {
        throw new Error(`[profileRepository.findByUserId] ${error.message}`);
      }
      return data ? rowToProfile(data) : null;
    },
  };
}
