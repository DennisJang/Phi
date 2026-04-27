import type { Intent, IntentKind, IntentState } from '@/types/intent';

/**
 * IntentRepository — domain interface for the `intents` table.
 *
 * PR2 ships the minimal surface needed for downstream wiring; PR3
 * expands this with state-machine helpers (transitionState,
 * appendProgress, findByIdempotencyKey, etc.) once the dispatch
 * layer is in place.
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
}
