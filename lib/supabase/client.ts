import { createBrowserClient } from '@supabase/ssr';
import type { SupabaseClient } from '@supabase/supabase-js';

// ---------------------------------------------------------------
// Singleton browser client
//
// All callers in the browser must share the same Supabase client
// instance, otherwise auth state (session, JWT) gets fragmented
// across instances and downstream calls authenticate inconsistently.
//
// This module is safe to import from any client component because
// the singleton is constructed lazily on first call, not at import.
// ---------------------------------------------------------------
let browserClient: SupabaseClient | null = null;

export function createClient(): SupabaseClient {
  if (browserClient) return browserClient;

  browserClient = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  return browserClient;
}

// ---------------------------------------------------------------
// Anonymous session bootstrap
//
// Phase 1 has no real auth, but RLS-scoped storage uploads (Step 4c)
// require a real auth.uid(). Supabase anonymous sign-in mints a real
// auth.users row with is_anonymous = true; from RLS's perspective it
// is indistinguishable from a regular user.
//
// Phase 2 will introduce Google OAuth + email magic link. At that
// point, an existing anonymous identity can be linked to a real one
// via supabase.auth.linkIdentity(), preserving any data created
// during the anonymous phase.
//
// Contract:
//   - If a session already exists (anonymous OR real), return ok.
//   - Otherwise, call signInAnonymously() and return its result.
//   - Never throws across the module boundary; errors are returned
//     as a tagged union, matching the rest of the codebase.
// ---------------------------------------------------------------
export type EnsureSessionResult =
  | { ok: true; userId: string; isAnonymous: boolean }
  | { ok: false; error: { kind: 'session_check_failed' | 'sign_in_failed'; message: string } };

// ---------------------------------------------------------------
// In-flight de-duplication
//
// React Strict Mode (and Suspense / streaming in production) can
// invoke useEffect more than once before the first call resolves.
// Without de-duplication, each call would mint a separate anonymous
// user row in auth.users, polluting the table and breaking the
// "one browser, one identity" invariant that Phase 2 linkIdentity
// will depend on.
//
// We solve this with a module-level in-flight promise: any caller
// while a sign-in is in progress receives the same promise. Once
// resolved, the result is cached so subsequent calls skip the
// network round-trip entirely.
// ---------------------------------------------------------------
let inFlight: Promise<EnsureSessionResult> | null = null;
let cachedResult: EnsureSessionResult | null = null;

export function ensureAnonymousSession(): Promise<EnsureSessionResult> {
  // Fast path: a successful result is sticky for the lifetime of the tab.
  if (cachedResult?.ok) return Promise.resolve(cachedResult);

  // De-dup: a sign-in is already running, return the same promise.
  if (inFlight) return inFlight;

  inFlight = doEnsureAnonymousSession();
  inFlight
    .then((result) => {
      cachedResult = result;
    })
    .finally(() => {
      inFlight = null;
    });

  return inFlight;
}

async function doEnsureAnonymousSession(): Promise<EnsureSessionResult> {
  const supabase = createClient();

  const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
  if (sessionError) {
    return {
      ok: false,
      error: { kind: 'session_check_failed', message: sessionError.message },
    };
  }

  // Existing session — anonymous or real, doesn't matter.
  if (sessionData.session?.user) {
    const user = sessionData.session.user;
    return {
      ok: true,
      userId: user.id,
      isAnonymous: user.is_anonymous ?? false,
    };
  }

  // No session — mint an anonymous one.
  const { data: signInData, error: signInError } = await supabase.auth.signInAnonymously();
  if (signInError || !signInData.user) {
    return {
      ok: false,
      error: {
        kind: 'sign_in_failed',
        message: signInError?.message ?? 'signInAnonymously returned no user',
      },
    };
  }

  return {
    ok: true,
    userId: signInData.user.id,
    isAnonymous: signInData.user.is_anonymous ?? true,
  };
}