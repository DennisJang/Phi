/**
 * Intent dispatch — the single entry point for intent execution.
 *
 * Pipeline:
 *   1. Validate the envelope shape (Zod base schema).
 *   2. Look up the handler by kind in the registry.
 *   3. Validate the kind-specific params with the handler's schema.
 *   4. Inject `actorId` from the server context — never trust the
 *      client. The schema deliberately doesn't include `actorId` so
 *      a client-supplied value can't reach the handler.
 *   5. Branch on `mode`:
 *        - sync: run the handler, return the result. No `intents`
 *          row, no event log entry (handlers own that in PR4+).
 *        - async: idempotency lookup → either replay an existing
 *          row's terminal result, attach to a still-running row,
 *          or create + drive a fresh state machine cycle.
 *
 * Errors are returned as a discriminated `DispatchResult.error`
 * (never thrown across the boundary). The HTTP route layer is
 * responsible for mapping `DispatchErrorKind` to status codes.
 */

import 'server-only';
import { z } from 'zod';

import type { IntentKind } from '@/types/intent';
import type { IntentServerContext } from './server';
import { getHandler, NotImplementedYetError } from './registry';
import {
  markRunning,
  markSucceeded,
  markFailed,
} from './state-machine';

export const ClientIntentEnvelopeSchema = z.object({
  kind: z.string().min(1).max(50),
  idempotencyKey: z.string().min(1).max(200),
  params: z.unknown(),
  triggerSource: z.string().max(100).optional().nullable(),
});

export type ClientIntentEnvelope = z.infer<typeof ClientIntentEnvelopeSchema>;

export interface IntentEnvelope extends ClientIntentEnvelope {
  actorId: string;
}

export type DispatchErrorKind =
  | 'envelope_invalid'
  | 'unknown_kind'
  | 'params_invalid'
  | 'not_implemented'
  | 'internal';

export interface DispatchError {
  kind: DispatchErrorKind;
  message: string;
  details?: unknown;
}

export type DispatchResult =
  | {
      ok: true;
      result: unknown;
      /** intents.id when async (or replayed async); null for sync intents. */
      intentId: string | null;
      /** True when the result came from an existing intents row, not a fresh run. */
      replayed: boolean;
    }
  | { ok: false; error: DispatchError };

function err(
  kind: DispatchErrorKind,
  message: string,
  details?: unknown,
): DispatchResult {
  return { ok: false, error: { kind, message, details } };
}

function asRecord(value: unknown): Record<string, unknown> {
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }
  return { value };
}

export async function dispatchIntent(
  rawEnvelope: unknown,
  ctx: IntentServerContext,
): Promise<DispatchResult> {
  // 1. Envelope shape
  const baseParse = ClientIntentEnvelopeSchema.safeParse(rawEnvelope);
  if (!baseParse.success) {
    return err(
      'envelope_invalid',
      'envelope shape invalid',
      baseParse.error.flatten(),
    );
  }
  const envelope = baseParse.data;
  const kind = envelope.kind as IntentKind;

  // 2. Handler lookup
  const spec = getHandler(kind);
  if (!spec) {
    return err('unknown_kind', `no handler registered for kind=${kind}`);
  }

  // 3. Params validation
  const paramsParse = spec.schema.safeParse(envelope.params);
  if (!paramsParse.success) {
    return err(
      'params_invalid',
      `invalid params for kind=${kind}`,
      paramsParse.error.flatten(),
    );
  }
  const params = paramsParse.data;

  // 4. Actor injection happens implicitly: handler receives `ctx`,
  //    which already carries the server-resolved actorId.

  // 5. Mode split
  if (spec.mode === 'sync') {
    return runHandler(spec, params, ctx, null, false);
  }
  return runAsync(envelope, kind, spec, params, ctx);
}

async function runHandler(
  spec: ReturnType<typeof getHandler>,
  params: unknown,
  ctx: IntentServerContext,
  intentId: string | null,
  replayed: boolean,
): Promise<DispatchResult> {
  if (!spec) {
    return err('unknown_kind', 'handler missing at execution time');
  }
  try {
    const result = await spec.handler(params, ctx);
    return { ok: true, result, intentId, replayed };
  } catch (caught) {
    if (caught instanceof NotImplementedYetError) {
      return err('not_implemented', caught.message);
    }
    return err(
      'internal',
      caught instanceof Error ? caught.message : String(caught),
    );
  }
}

async function runAsync(
  envelope: ClientIntentEnvelope,
  kind: IntentKind,
  spec: NonNullable<ReturnType<typeof getHandler>>,
  params: unknown,
  ctx: IntentServerContext,
): Promise<DispatchResult> {
  const repo = ctx.repos.intents;

  // 5a. Idempotency lookup (partial UNIQUE WHERE completed_at IS NULL).
  const inflight = await repo.findByIdempotencyKey(
    ctx.actorId,
    kind,
    envelope.idempotencyKey,
  );
  if (inflight) {
    // Existing row, completed_at IS NULL → still running or pending.
    // Caller polls /api/intents/{id} for the terminal state.
    return {
      ok: true,
      result: inflight.result,
      intentId: inflight.id,
      replayed: true,
    };
  }

  // 5b. Fresh row + state machine cycle.
  let intentId: string;
  try {
    const created = await repo.create({
      kind,
      actorId: ctx.actorId,
      idempotencyKey: envelope.idempotencyKey,
      triggerSource: envelope.triggerSource ?? null,
      params: asRecord(params),
    });
    intentId = created.id;
  } catch (caught) {
    return err(
      'internal',
      caught instanceof Error
        ? `intents.create failed: ${caught.message}`
        : 'intents.create failed',
    );
  }

  try {
    await markRunning(intentId, repo);
  } catch (caught) {
    return err(
      'internal',
      caught instanceof Error
        ? `markRunning failed: ${caught.message}`
        : 'markRunning failed',
    );
  }

  let result: unknown;
  try {
    result = await spec.handler(params, ctx);
  } catch (caught) {
    const errorPayload =
      caught instanceof NotImplementedYetError
        ? { kind: 'not_implemented', message: caught.message }
        : {
            kind: 'internal',
            message: caught instanceof Error ? caught.message : String(caught),
          };
    await markFailed(intentId, errorPayload, repo);
    if (caught instanceof NotImplementedYetError) {
      return err('not_implemented', caught.message);
    }
    return err(
      'internal',
      caught instanceof Error ? caught.message : String(caught),
    );
  }

  await markSucceeded(intentId, asRecord(result), repo);
  return { ok: true, result, intentId, replayed: false };
}
