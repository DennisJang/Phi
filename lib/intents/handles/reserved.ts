/**
 * BS-26 reserved handle list.
 *
 * Handles users cannot claim. Five groups of ten entries (50 total)
 * cover the load-bearing categories:
 *   - system    — auth / API / settings paths that would clash with
 *                 internal route handlers
 *   - brand     — Phi-brand impersonation surfaces
 *   - route     — single-letter URL segments reserved for future
 *                 routing (`/u/`, `/s/`, etc.)
 *   - common    — high-misclick UX-risk handles (help, terms, …)
 *   - ownership — generic "I represent this org" handles that should
 *                 never resolve to a personal account
 *
 * The list is a **starter** the strategist may swap entries on. The
 * intent layer (PR4 ChangeHandle) consumes `isReservedHandle` only —
 * adding or removing entries does not require touching call sites.
 *
 * Lookup is case-insensitive: handles are normalized to lowercase
 * before comparison. The CHECK constraint on `profiles.handle` is
 * separately responsible for format (alphanumeric + underscore,
 * length 3-24) — this list only enforces the reservation policy.
 */

export type ReservedGroup =
  | 'system'
  | 'brand'
  | 'route'
  | 'common'
  | 'ownership';

export interface ReservedEntry {
  handle: string;
  group: ReservedGroup;
}

const ENTRIES: readonly ReservedEntry[] = [
  // system — 10
  { handle: 'admin', group: 'system' },
  { handle: 'api', group: 'system' },
  { handle: 'auth', group: 'system' },
  { handle: 'login', group: 'system' },
  { handle: 'logout', group: 'system' },
  { handle: 'signup', group: 'system' },
  { handle: 'signin', group: 'system' },
  { handle: 'settings', group: 'system' },
  { handle: 'account', group: 'system' },
  { handle: 'system', group: 'system' },

  // brand — 10
  { handle: 'phi', group: 'brand' },
  { handle: 'phibook', group: 'brand' },
  { handle: 'phiapp', group: 'brand' },
  { handle: 'phi_app', group: 'brand' },
  { handle: 'phi_book', group: 'brand' },
  { handle: 'phishelf', group: 'brand' },
  { handle: 'phi_shelf', group: 'brand' },
  { handle: 'phi_team', group: 'brand' },
  { handle: 'phi_official', group: 'brand' },
  { handle: 'phi_support', group: 'brand' },

  // route — 10 (single letters reserved for URL path namespaces)
  { handle: 'u', group: 'route' },
  { handle: 's', group: 'route' },
  { handle: 'c', group: 'route' },
  { handle: 'b', group: 'route' },
  { handle: 'p', group: 'route' },
  { handle: 'e', group: 'route' },
  { handle: 't', group: 'route' },
  { handle: 'm', group: 'route' },
  { handle: 'n', group: 'route' },
  { handle: 'r', group: 'route' },

  // common — 10
  { handle: 'help', group: 'common' },
  { handle: 'support', group: 'common' },
  { handle: 'contact', group: 'common' },
  { handle: 'about', group: 'common' },
  { handle: 'terms', group: 'common' },
  { handle: 'privacy', group: 'common' },
  { handle: 'faq', group: 'common' },
  { handle: 'docs', group: 'common' },
  { handle: 'blog', group: 'common' },
  { handle: 'news', group: 'common' },

  // ownership — 10
  { handle: 'root', group: 'ownership' },
  { handle: 'owner', group: 'ownership' },
  { handle: 'official', group: 'ownership' },
  { handle: 'team', group: 'ownership' },
  { handle: 'staff', group: 'ownership' },
  { handle: 'mod', group: 'ownership' },
  { handle: 'moderator', group: 'ownership' },
  { handle: 'dev', group: 'ownership' },
  { handle: 'developer', group: 'ownership' },
  { handle: 'founder', group: 'ownership' },
];

export const RESERVED_HANDLES: ReadonlyMap<string, ReservedGroup> = new Map(
  ENTRIES.map((entry) => [entry.handle.toLowerCase(), entry.group]),
);

/**
 * Returns the matching `ReservedEntry` if `handle` (case-insensitive)
 * is reserved, otherwise `null`. The intent layer surfaces the
 * `group` to compose user-facing error messages.
 */
export function isReservedHandle(handle: string): ReservedEntry | null {
  const normalized = handle.trim().toLowerCase();
  if (!normalized) return null;
  const group = RESERVED_HANDLES.get(normalized);
  return group ? { handle: normalized, group } : null;
}
