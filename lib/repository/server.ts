import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database';
import { createClient } from '@/lib/supabase/server';
import { createBookRepository } from '@/lib/supabase/repositories/bookRepository';
import { createShelfRepository } from '@/lib/supabase/repositories/shelfRepository';
import { createProfileRepository } from '@/lib/supabase/repositories/profileRepository';
import type { BookRepository } from '@/lib/repository/books';
import type { ShelfRepository } from '@/lib/repository/shelves';
import type { ProfileRepository } from '@/lib/repository/profiles';

export interface ServerRepositories {
  books: BookRepository;
  shelves: ShelfRepository;
  profiles: ProfileRepository;
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
    shelves: createShelfRepository(supabase),
    profiles: createProfileRepository(supabase),
  };
}
