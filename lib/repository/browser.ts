import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database';
import { createClient } from '@/lib/supabase/client';
import { createBookRepository } from '@/lib/supabase/repositories/bookRepository';
import { createShelfRepository } from '@/lib/supabase/repositories/shelfRepository';
import { createProfileRepository } from '@/lib/supabase/repositories/profileRepository';

/**
 * Browser-side wired repositories.
 *
 * Shares the singleton browser client (via `@/lib/supabase/client`
 * createClient) so every caller sees the same auth state. Imported
 * lazily when first accessed, matching the client's singleton
 * construction at first call (not at import).
 *
 * Client components that need book/shelf/profile data should import
 * from here, never construct repositories themselves.
 */

function browserSupabase(): SupabaseClient<Database> {
  // The browser client factory returns an untyped SupabaseClient for
  // backwards compatibility with ensureAnonymousSession's existing
  // call sites. The type-safe assertion here is honored by the fact
  // that types/database.ts is regenerated from the live schema.
  return createClient() as unknown as SupabaseClient<Database>;
}

export const bookRepository = createBookRepository(browserSupabase());
export const shelfRepository = createShelfRepository(browserSupabase());
export const profileRepository = createProfileRepository(browserSupabase());
