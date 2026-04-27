import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database';
import { createAdminClient } from '@/lib/supabase/admin';
import { createBookRepository } from '@/lib/supabase/repositories/bookRepository';
import { createProfileRepository } from '@/lib/supabase/repositories/profileRepository';
import { createBookmarkRepository } from '@/lib/supabase/repositories/bookmarkRepository';
import { createShelfAffinityRepository } from '@/lib/supabase/repositories/shelfAffinityRepository';
import { createIntentRepository } from '@/lib/supabase/repositories/intentRepository';
import { createTierLimitRepository } from '@/lib/supabase/repositories/tierLimitRepository';
import type { BookRepository } from '@/lib/repository/books';
import type { ProfileRepository } from '@/lib/repository/profiles';
import type { BookmarkRepository } from '@/lib/repository/bookmarks';
import type { ShelfAffinityRepository } from '@/lib/repository/shelfAffinities';
import type { IntentRepository } from '@/lib/repository/intents';
import type { TierLimitRepository } from '@/lib/repository/tierLimits';

export interface AdminRepositories {
  books: BookRepository;
  profiles: ProfileRepository;
  bookmarks: BookmarkRepository;
  shelfAffinities: ShelfAffinityRepository;
  intents: IntentRepository;
  tierLimits: TierLimitRepository;
}

/**
 * Admin-side wired repositories using the service_role key. These
 * bypass RLS — reserve strictly for server-side maintenance paths
 * (batch operations, support tooling, intent worker queue) where
 * callers have vetted authorization by other means. Never import
 * from client-reachable code.
 */
export function createAdminRepositories(): AdminRepositories {
  const supabase = createAdminClient() as unknown as SupabaseClient<Database>;
  return {
    books: createBookRepository(supabase),
    profiles: createProfileRepository(supabase),
    bookmarks: createBookmarkRepository(supabase),
    shelfAffinities: createShelfAffinityRepository(supabase),
    intents: createIntentRepository(supabase),
    tierLimits: createTierLimitRepository(supabase),
  };
}
