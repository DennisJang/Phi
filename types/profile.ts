/**
 * Profile — domain type for the `profiles` table.
 *
 * Fields use camelCase; the Supabase adapter in
 * lib/supabase/repositories/profileRepository.ts maps from the
 * snake_case DB row shape at the boundary.
 *
 * The primary key in the DB is `id`, which is also the auth.users
 * foreign key. Surfaced here as `userId` for consistency with how
 * UI code refers to identity.
 *
 * See .claude/PROJECT_KNOWLEDGE.md §6 "Monetization" for tier /
 * tierSource / quotaBonus semantics, §5.2 for referralCode.
 */

export type ProfileTier = 'free' | 'plus' | 'pro';

export type ProfileTierSource =
  | 'default'
  | 'paid'
  | 'founding'
  | 'referral'
  | 'event';

export interface Profile {
  userId: string;

  tier: ProfileTier;
  tierSource: ProfileTierSource;
  quotaBonus: Record<string, unknown>;

  referralCode: string;

  readingStreakCurrent: number;
  readingStreakLongest: number;
  readingStreakLastAt: string | null;
}
