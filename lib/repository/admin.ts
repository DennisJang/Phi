import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database';
import { createAdminClient } from '@/lib/supabase/admin';
import { createBookRepository } from '@/lib/supabase/repositories/bookRepository';
import { createShelfRepository } from '@/lib/supabase/repositories/shelfRepository';
import { createProfileRepository } from '@/lib/supabase/repositories/profileRepository';
import type { BookRepository } from '@/lib/repository/books';
import type { ShelfRepository } from '@/lib/repository/shelves';
import type { ProfileRepository } from '@/lib/repository/profiles';

export interface AdminRepositories {
  books: BookRepository;
  shelves: ShelfRepository;
  profiles: ProfileRepository;
}

/**
 * Admin-side wired repositories using the service_role key. These
 * bypass RLS — reserve strictly for server-side maintenance paths
 * (batch operations, support tooling) where callers have vetted
 * authorization by other means. Never import from client-reachable
 * code.
 *
 * Phase 1 has no production user of this wiring; it exists so future
 * admin routes (if any) have a boundary-respecting path.
 */
export function createAdminRepositories(): AdminRepositories {
  const supabase = createAdminClient() as unknown as SupabaseClient<Database>;
  return {
    books: createBookRepository(supabase),
    shelves: createShelfRepository(supabase),
    profiles: createProfileRepository(supabase),
  };
}
