import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database';
import type { Profile, ProfileTier, ProfileTierSource } from '@/types/profile';
import type { ProfileRepository } from '@/lib/repository/profiles';

type ProfileRow = Database['public']['Tables']['profiles']['Row'];

const PROFILE_COLUMNS =
  'user_id, handle, display_name, avatar_url, country, ' +
  'tier, tier_source, tier_expires_at, launch_grace_until, ' +
  'entry_pattern_type, orphan_marked_at, handle_changed_at, ' +
  'referral_code, theme_preference, language_preference, ' +
  'created_at, updated_at';

function rowToProfile(row: ProfileRow): Profile {
  return {
    userId: row.user_id,
    handle: row.handle,
    displayName: row.display_name,
    avatarUrl: row.avatar_url,
    country: row.country,
    tier: row.tier as ProfileTier,
    tierSource: row.tier_source as ProfileTierSource,
    tierExpiresAt: row.tier_expires_at,
    launchGraceUntil: row.launch_grace_until,
    entryPatternType: row.entry_pattern_type,
    orphanMarkedAt: row.orphan_marked_at,
    handleChangedAt: row.handle_changed_at,
    referralCode: row.referral_code,
    themePreference: row.theme_preference,
    languagePreference: row.language_preference,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
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
        .eq('user_id', userId)
        .returns<ProfileRow[]>()
        .maybeSingle();

      if (error) {
        throw new Error(`[profileRepository.findByUserId] ${error.message}`);
      }
      return data ? rowToProfile(data) : null;
    },
  };
}
