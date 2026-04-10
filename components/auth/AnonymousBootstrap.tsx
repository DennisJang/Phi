'use client';

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { ensureAnonymousSession } from '@/lib/supabase/client';

// ---------------------------------------------------------------
// Anonymous session context
//
// Mounted once at the root layout. Triggers ensureAnonymousSession()
// on first mount and exposes readiness state to descendants via the
// useAnonymousSession() hook.
//
// Phase 2 transition: when real auth is added, this provider can be
// extended to also expose the linked identity. The shape of the
// context value should not break — `userId` and `isAnonymous` will
// still be valid fields.
// ---------------------------------------------------------------

type SessionState =
  | { status: 'loading' }
  | { status: 'ready'; userId: string; isAnonymous: boolean }
  | { status: 'error'; message: string };

const SessionContext = createContext<SessionState>({ status: 'loading' });

export function useAnonymousSession(): SessionState {
  return useContext(SessionContext);
}

export function AnonymousBootstrap({ children }: { children: ReactNode }) {
  const [state, setState] = useState<SessionState>({ status: 'loading' });

  useEffect(() => {
    let cancelled = false;

    void (async () => {
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