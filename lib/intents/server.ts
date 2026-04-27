/**
 * Server-side intent entry point.
 *
 * `import 'server-only'` at module load throws if anything bundles
 * this file into a client chunk — a hard guarantee that intent
 * dispatch never executes in the browser.
 *
 * PR3 ships the context plumbing only: authentication resolution and
 * the request-bound repository handle. Intent registration and the
 * dispatch loop arrive in a follow-up PR.
 */

import 'server-only';

import { createClient } from '@/lib/supabase/server';
import { createServerRepositories } from '@/lib/repository/server';
import type { ServerRepositories } from '@/lib/repository/server';

export interface IntentServerContext {
  repos: ServerRepositories;
  /** auth.users.id — also `profiles.user_id` after profile bootstrap. */
  actorId: string;
  /**
   * Free-form tag identifying which UI surface initiated the intent
   * (e.g. `'bookshelf:add'`, `'card:share-x'`). Persisted to
   * `intents.trigger_source` and `events.trigger_source`.
   */
  triggerSource: string | null;
}

export class IntentAuthError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'IntentAuthError';
  }
}

/**
 * Build the server-side context for an intent invocation in the
 * current request. Resolves the authenticated actor and wires the
 * cookie-scoped repository bundle.
 */
export async function buildIntentServerContext(
  triggerSource: string | null = null,
): Promise<IntentServerContext> {
  const supabase = await createClient();
  const { data: userData, error } = await supabase.auth.getUser();

  if (error || !userData.user) {
    throw new IntentAuthError(
      `[intents/server] unauthenticated${error ? `: ${error.message}` : ''}`,
    );
  }

  const repos = await createServerRepositories();

  return {
    repos,
    actorId: userData.user.id,
    triggerSource,
  };
}
