/**
 * PhiEvent — domain type for the `events` table (Phi 2.0 telemetry).
 *
 * Append-only structured log keyed by (kind, actor_id, target_*).
 * Every Intent that mutates state should record an event after a
 * successful transaction. The event log feeds the `events_for_owner`
 * view that powers the Reverberation surface (reactions to a user's
 * shelf from visitors).
 *
 * The DB column is `id BIGINT`; it surfaces here as `number`.
 * `idempotency_key` ties the event to the intent that produced it
 * for deterministic deduplication of Reverberation reads.
 */

export type EventKind = string; // Open set in Phase 1-2; tighten when set stabilizes.

export interface PhiEvent {
  id: number;
  kind: EventKind;
  actorId: string | null;
  intentId: string | null;
  idempotencyKey: string | null;
  triggerSource: string | null;

  params: Record<string, unknown> | null;
  result: Record<string, unknown> | null;

  actorCountry: string | null;
  targetId: string | null;
  targetKind: string | null;

  createdAt: string;
}
