/**
 * Anonymous user identifier for pre-auth surfaces.
 *
 * Backs the daily quote rotation (see `getTodayQuote` in quotes.ts)
 * with a stable per-browser UUID, so the quote does not reshuffle on
 * every page load before the user has a Supabase session.
 *
 * Client-only by design. The server fallback is a constant so SSR
 * passes type-check, but callers should only invoke this from a
 * `'use client'` boundary (typically inside `useEffect`).
 */

const STORAGE_KEY = 'phi:anon-id';
const SERVER_FALLBACK = 'phi:server-fallback';

export function getOrCreateAnonId(): string {
  if (typeof window === 'undefined') {
    return SERVER_FALLBACK;
  }

  try {
    const existing = window.localStorage.getItem(STORAGE_KEY);
    if (existing) return existing;

    const fresh = window.crypto.randomUUID();
    window.localStorage.setItem(STORAGE_KEY, fresh);
    return fresh;
  } catch {
    // Private-mode Safari / storage quota / disabled cookies.
    // Stable-per-session fallback: same string for this page load,
    // quote still deterministic within the session.
    return SERVER_FALLBACK;
  }
}
