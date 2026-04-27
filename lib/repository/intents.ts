import type { Intent, IntentKind, IntentState } from '@/types/intent';

/**
 * IntentRepository — domain interface for the `intents` table.
 *
 * The dispatch layer (lib/intents/dispatch.ts) drives every async
 * intent through this interface. The state-machine helpers in
 * lib/intents/state-machine.ts wrap the transition methods so the
 * pure-validation rules and the DB writes stay in one place.
 */
export interface CreateIntentInput {
  kind: IntentKind;
  actorId: string;
  idempotencyKey: string;
  triggerSource?: string | null;
  params: Record<string, unknown>;
  state?: IntentState;
}

export interface IntentRepository {
  create(input: CreateIntentInput): Promise<Intent>;
  findById(id: string): Promise<Intent | null>;

  /**
   * Idempotency lookup. The `intents_idempotency_unique_partial`
   * UNIQUE index is partial: WHERE completed_at IS NULL. This method
   * mirrors that semantic — it only returns rows where
   * `completed_at IS NULL`. Completed rows are looked up by id (or
   * by widening the search) when replay is needed.
   */
  findByIdempotencyKey(
    actorId: string,
    kind: IntentKind,
    idempotencyKey: string,
  ): Promise<Intent | null>;

  /**
   * Pure state transition — used by `markRunning`. Validation that
   * the transition is allowed lives in the state machine, not here.
   */
  transitionState(id: string, newState: IntentState): Promise<Intent>;

  /** UPDATE state='succeeded', result, completed_at, updated_at. */
  completeWithResult(
    id: string,
    result: Record<string, unknown>,
  ): Promise<Intent>;

  /** UPDATE state='failed', error, completed_at, updated_at. */
  completeWithError(
    id: string,
    error: Record<string, unknown>,
  ): Promise<Intent>;
}
