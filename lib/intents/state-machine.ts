/**
 * Intent state machine.
 *
 * Pure transition validation lives at the top of the file (no DB
 * access — easy to reason about and unit test). The repo-binding
 * helpers below wrap the pure check with the corresponding
 * `IntentRepository` write so the dispatch layer never has to
 * remember to do both.
 *
 * Transitions:
 *   pending   → running
 *   running   → succeeded | failed
 *   succeeded → ∅  (terminal)
 *   failed    → ∅  (terminal)
 *
 * `retry_count` and `next_retry_at` are intentionally untouched in
 * Stage 1 — failure is terminal here. Phase 2+ will revisit when
 * the worker / cron lands; widening this state machine without the
 * runtime to drive it is premature.
 */

import type { Intent, IntentState } from '@/types/intent';
import type { IntentRepository } from '@/lib/repository/intents';

export const ALLOWED_TRANSITIONS: Readonly<
  Record<IntentState, ReadonlyArray<IntentState>>
> = Object.freeze({
  pending: ['running'] as const,
  running: ['succeeded', 'failed'] as const,
  succeeded: [] as const,
  failed: [] as const,
});

export function canTransition(from: IntentState, to: IntentState): boolean {
  return ALLOWED_TRANSITIONS[from].includes(to);
}

export function isTerminal(state: IntentState): boolean {
  return ALLOWED_TRANSITIONS[state].length === 0;
}

export class InvalidTransitionError extends Error {
  readonly from: IntentState;
  readonly to: IntentState;

  constructor(from: IntentState, to: IntentState) {
    super(`[state-machine] cannot transition from '${from}' to '${to}'`);
    this.name = 'InvalidTransitionError';
    this.from = from;
    this.to = to;
  }
}

function assertTransition(from: IntentState, to: IntentState): void {
  if (!canTransition(from, to)) {
    throw new InvalidTransitionError(from, to);
  }
}

/**
 * pending → running. Read-then-transition; the asserted current
 * state is `pending`, anything else (already running, terminal, or
 * missing row) throws.
 */
export async function markRunning(
  intentId: string,
  repo: IntentRepository,
): Promise<Intent> {
  const current = await repo.findById(intentId);
  if (!current) {
    throw new Error(`[state-machine.markRunning] intent ${intentId} not found`);
  }
  assertTransition(current.state, 'running');
  return repo.transitionState(intentId, 'running');
}

/** running → succeeded with persisted result. */
export async function markSucceeded(
  intentId: string,
  result: Record<string, unknown>,
  repo: IntentRepository,
): Promise<Intent> {
  const current = await repo.findById(intentId);
  if (!current) {
    throw new Error(
      `[state-machine.markSucceeded] intent ${intentId} not found`,
    );
  }
  assertTransition(current.state, 'succeeded');
  return repo.completeWithResult(intentId, result);
}

/** running → failed with persisted error. */
export async function markFailed(
  intentId: string,
  error: Record<string, unknown>,
  repo: IntentRepository,
): Promise<Intent> {
  const current = await repo.findById(intentId);
  if (!current) {
    throw new Error(`[state-machine.markFailed] intent ${intentId} not found`);
  }
  assertTransition(current.state, 'failed');
  return repo.completeWithError(intentId, error);
}
