'use client';

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { ensureAnonymousSession, createClient } from '@/lib/supabase/client';

// ---------------------------------------------------------------
// Anonymous session context
//
// Mounted once at the root layout. On first mount, resolves the
// caller's Supabase session in one of two ways:
//
//   (A) DEV BRANCH — only attempted in NODE_ENV === 'development':
//       POST /api/dev/login. If the route exists AND returns ok,
//       we are now authenticated as the fixed developer account
//       and skip anonymous sign-in entirely.
//
//       The route itself gates on the same NODE_ENV check and on
//       the presence of DEV_FIXED_USER_ID, so in Vercel prod the
//       endpoint returns 404 and we silently fall through.
//
//   (B) ANON BRANCH — always available:
//       ensureAnonymousSession() runs as before. Its contract is
//       unchanged — the dev branch is a pre-step, not a rewrite.
//
// Fall-through semantics
// ----------------------
// The dev branch is best-effort: any non-2xx response (including
// 404 in prod) or any network error routes to (B). This keeps the
// production path identical to what it was before this commit —
// one less way to break real users.
//
// Phase 2 transition
// ------------------
// When real auth lands (Google OAuth, email magic link), the dev
// branch is either kept as a first-class developer shortcut or
// deleted. The anon branch will remain as the pre-login fallback
// until /u/{username} flows force sign-in.
// ---------------------------------------------------------------

type SessionState =
  | { status: 'loading' }
  | { status: 'ready'; userId: string; isAnonymous: boolean }
  | { status: 'error'; message: string };

const SessionContext = createContext<SessionState>({ status: 'loading' });

export function useAnonymousSession(): SessionState {
  return useContext(SessionContext);
}

/**
 * Attempt to authenticate as the fixed developer account via
 * /api/dev/login. Returns the resulting session on success, or
 * null to signal "fall through to anonymous sign-in".
 *
 * Why null instead of throwing: a missing route (404 in prod) is
 * an expected, non-error outcome. Distinguishing expected-null
 * from actual-error at the call site simplifies the reducer.
 */
async function tryDevLogin(): Promise<
  { userId: string; isAnonymous: boolean } | null
> {
  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  try {
    const response = await fetch('/api/dev/login', {
      method: 'POST',
      // Cookies are same-origin; no credentials overrides needed.
    });

    if (!response.ok) {
      // 404 (env missing, or prod) or 5xx (bad config) — fall through.
      return null;
    }

    // Route succeeded, but we deliberately re-verify through getUser()
    // rather than trusting the response body. getUser() round-trips to
    // Supabase and verifies the JWT we just received, which is the
    // only source of truth for "are the cookies actually valid".
    const supabase = createClient();
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) return null;

    return {
      userId: data.user.id,
      isAnonymous: data.user.is_anonymous ?? false,
    };
  } catch {
    // Network error, offline, etc. — fall through silently.
    return null;
  }
}

export function AnonymousBootstrap({ children }: { children: ReactNode }) {
  const [state, setState] = useState<SessionState>({ status: 'loading' });

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      // Branch A: dev-fixed login (no-op in prod).
      const devSession = await tryDevLogin();
      if (cancelled) return;
      if (devSession) {
        setState({
          status: 'ready',
          userId: devSession.userId,
          isAnonymous: devSession.isAnonymous,
        });
        return;
      }

      // Branch B: anonymous sign-in (unchanged contract).
      const result = await ensureAnonymousSession();
      if (cancelled) return;
      if (result.ok) {
        setState({
          status: 'ready',
          userId: result.userId,
          isAnonymous: result.isAnonymous,
        });
      } else {
        setState({ status: 'error', message: result.error.message });
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  return <SessionContext.Provider value={state}>{children}</SessionContext.Provider>;
}