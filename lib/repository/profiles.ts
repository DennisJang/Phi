import type { Profile } from '@/types/profile';

/**
 * ProfileRepository — domain interface for profiles table access.
 *
 * `findByUserId` returns `null` when no row exists yet — for
 * example, the brief window between `auth.users` insertion and
 * the `handle_new_profile` trigger firing.
 */
export interface ProfileRepository {
  findByUserId(userId: string): Promise<Profile | null>;
}
