/**
 * Profile — domain type for the `profiles` table.
 *
 * Fields use camelCase; the Supabase adapter in
 * lib/supabase/repositories/profileRepository.ts maps from the
 * snake_case DB row shape at the boundary.
 *
 * Primary key is `user_id` (DB column), which is also the auth.users
 * foreign key. Surfaced here as `userId`.
 *
 * `handle` is nullable — set explicitly via ChangeHandle intent;
 * a freshly-created anonymous account has `handle === null` until
 * the user picks one.
 */

export type ProfileTier = 'free' | 'standard' | 'pro';

export type ProfileTierSource = 'free' | 'launch_event' | 'paid_subscription';

export interface Profile {
  userId: string;

  handle: string | null;
  displayName: string | null;
  avatarUrl: string | null;
  country: string | null; // ISO 3166-1 alpha-2

  tier: ProfileTier;
  tierSource: ProfileTierSource;
  tierExpiresAt: string | null;
  launchGraceUntil: string | null;

  entryPatternType: string;
  orphanMarkedAt: string | null;
  handleChangedAt: string | null;

  referralCode: string;
  themePreference: string | null;
  languagePreference: string | null;

  createdAt: string | null;
  updatedAt: string | null;
}
