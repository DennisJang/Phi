import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database';
import { createClient } from '@/lib/supabase/server';
import { createBookRepository } from '@/lib/supabase/repositories/bookRepository';
import { createProfileRepository } from '@/lib/supabase/repositories/profileRepository';
import { createBookmarkRepository } from '@/lib/supabase/repositories/bookmarkRepository';
import { createShelfAffinityRepository } from '@/lib/supabase/repositories/shelfAffinityRepository';
import { createIntentRepository } from '@/lib/supabase/repositories/intentRepository';
import type { BookRepository } from '@/lib/repository/books';
import type { ProfileRepository } from '@/lib/repository/profiles';
import type { BookmarkRepository } from '@/lib/repository/bookmarks';
import type { ShelfAffinityRepository } from '@/lib/repository/shelfAffinities';
import type { IntentRepository } from '@/lib/repository/intents';

export interface ServerRepositories {
  books: BookRepository;
  profiles: ProfileRepository;
  bookmarks: BookmarkRepository;
  shelfAffinities: ShelfAffinityRepository;
  intents: IntentRepository;
}

/**
 * Server-side wired repositories, bound to the request's cookie-scoped
 * Supabase client. RLS is enforced on every query. Call once per
 * request/render and pass the result down — do not cache at module
 * scope because the underlying client is request-bound.
 */
export async function createServerRepositories(): Promise<ServerRepositories> {
  const supabase = (await createClient()) as unknown as SupabaseClient<Database>;
  return {
    books: createBookRepository(supabase),
    profiles: createProfileRepository(supabase),
    bookmarks: createBookmarkRepository(supabase),
    shelfAffinities: createShelfAffinityRepository(supabase),
    intents: createIntentRepository(supabase),
  };
}
