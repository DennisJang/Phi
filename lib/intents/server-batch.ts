/**
 * Service-role intent entry point — Dormant in Phase 1.
 *
 * The single sanctioned crossing of the service_role boundary inside
 * `lib/intents/*`. ESLint enforces this: every other module under
 * `lib/intents` is forbidden from importing `@/lib/repository/admin`.
 *
 * Use only for paths where RLS bypass is intentional:
 *   - GC worker (Phase 2 cleanup cron)
 *   - Support / admin tooling escalations
 *   - Edge function intent execution
 *
 * Phase 1 has no production caller. The wrapper exists so the
 * boundary is in code well before the first batch path lands; PR5
 * spec and the eventual cron implementation can wire without
 * relitigating this seam.
 */

import 'server-only';

import { createAdminRepositories } from '@/lib/repository/admin';
import type { AdminRepositories } from '@/lib/repository/admin';

export type IntentBatchTrigger = 'cron' | 'gc' | 'manual_admin';

export interface IntentBatchContext {
  repos: AdminRepositories;
  /** `null` when the action is system-driven (cron, GC). */
  actorId: string | null;
  triggerSource: IntentBatchTrigger;
}

/**
 * Build a service-role-scoped context. Synchronous because admin
 * repositories are constructed without per-request cookie state.
 */
export function buildIntentBatchContext(
  triggerSource: IntentBatchTrigger,
  actorId: string | null = null,
): IntentBatchContext {
  return {
    repos: createAdminRepositories(),
    actorId,
    triggerSource,
  };
}
