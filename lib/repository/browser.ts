import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database';
import { createClient } from '@/lib/supabase/client';
import { createBookRepository } from '@/lib/supabase/repositories/bookRepository';
import { createProfileRepository } from '@/lib/supabase/repositories/profileRepository';
import { createBookmarkRepository } from '@/lib/supabase/repositories/bookmarkRepository';
import { createShelfAffinityRepository } from '@/lib/supabase/repositories/shelfAffinityRepository';
import { createIntentRepository } from '@/lib/supabase/repositories/intentRepository';

/**
 * Browser-side wired repositories.
 *
 * Shares the singleton browser client (via `@/lib/supabase/client`
 * createClient) so every caller sees the same auth state. Imported
 * lazily when first accessed, matching the client's singleton
 * construction at first call (not at import).
 *
 * Client components that need data should import from here, never
 * construct repositories themselves.
 */

function browserSupabase(): SupabaseClient<Database> {
  return createClient() as unknown as SupabaseClient<Database>;
}

export const bookRepository = createBookRepository(browserSupabase());
export const profileRepository = createProfileRepository(browserSupabase());
export const bookmarkRepository = createBookmarkRepository(browserSupabase());
export const shelfAffinityRepository = createShelfAffinityRepository(
  browserSupabase(),
);
export const intentRepository = createIntentRepository(browserSupabase());
