/**
 * Intent — domain type for the `intents` table.
 *
 * The Intent layer is the single mutation entry point for Phi 2.0.
 * Every user-driven write threads through a row here: either
 * synchronously (state goes queued → succeeded inside the dispatch
 * call) or asynchronously (queued → running → succeeded/failed/canceled
 * across multiple workers).
 *
 * `idempotency_key` is unique per (actor_id, kind) WHERE
 * completed_at IS NULL — replay before completion deduplicates,
 * replay after completion returns the cached result.
 */

export type IntentKind =
  | 'add_book'
  | 'remove_book'
  | 'move_section'
  | 'enter_shelf'
  | 'bookmark'
  | 'create_card'
  | 'share_card'
  | 'change_handle'
  | 'link_identity'
  | 'upgrade_tier'
  | 'update_preferences'
  | 'ensure_session'
  | 'add_bookmark'
  | 'remove_bookmark'
  | 'delete_card'
  | 'visit_shelf'
  | 'leave_shelf'
  | 'import_books';

export type IntentState =
  | 'queued'
  | 'running'
  | 'succeeded'
  | 'failed'
  | 'canceled';

export interface Intent {
  id: string;
  kind: IntentKind;
  actorId: string;
  idempotencyKey: string;
  triggerSource: string | null;

  state: IntentState;
  params: Record<string, unknown>;
  progress: Record<string, unknown>;
  result: Record<string, unknown> | null;
  error: Record<string, unknown> | null;

  retryCount: number;
  nextRetryAt: string | null;

  startedAt: string;
  updatedAt: string;
  completedAt: string | null;
}
