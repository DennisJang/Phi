import { createClient } from '@supabase/supabase-js';

/**
 * Admin Supabase client using the service_role key.
 *
 * CRITICAL: This client bypasses all Row Level Security. It must NEVER be
 * imported by any file that runs in the browser. Use only in:
 *   - API route handlers (app/api/**\/route.ts)
 *   - Server actions
 *   - Edge functions (if ever adopted)
 *
 * The session is intentionally disabled: each request creates a fresh
 * client, uses it once, and discards it. No cookies, no auto-refresh.
 *
 * Why a factory instead of a singleton: Next.js may run this module in
 * multiple worker threads, and holding a singleton across requests can
 * leak state in edge cases. Per-request construction is cheap.
 */
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url) {
    throw new Error(
      '[supabase/admin] NEXT_PUBLIC_SUPABASE_URL is not defined'
    );
  }
  if (!serviceRoleKey) {
    throw new Error(
      '[supabase/admin] SUPABASE_SERVICE_ROLE_KEY is not defined'
    );
  }

  return createClient(url, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });
}