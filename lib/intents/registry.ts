/**
 * Intent registry.
 *
 * Module-load side effect: every IntentKind is pre-registered with a
 * stub handler that throws `NotImplementedYetError`. PR4 (and later
 * PRs) override entries by calling `registerIntent(kind, spec)`
 * with the production schema + handler.
 *
 * Why pre-register stubs instead of leaving the map empty:
 * dispatch.ts can distinguish "kind doesn't exist" (typo, malicious
 * envelope) from "kind known but not yet wired" — the former is a
 * 404, the latter a 501. Both are useful signals during incremental
 * rollout.
 */

import { z } from 'zod';
import type { IntentKind } from '@/types/intent';
import type { IntentServerContext } from './server';

export type IntentMode = 'sync' | 'async';

export interface IntentHandlerSpec<Params = unknown, Result = unknown> {
  schema: z.ZodSchema<Params>;
  mode: IntentMode;
  handler: (params: Params, ctx: IntentServerContext) => Promise<Result>;
}

export class NotImplementedYetError extends Error {
  readonly kind: IntentKind;

  constructor(kind: IntentKind) {
    super(`[intent ${kind}] not implemented yet`);
    this.name = 'NotImplementedYetError';
    this.kind = kind;
  }
}

const ALL_KINDS: readonly IntentKind[] = [
  // Phase 1 alpha — production handlers land in PR4
  'add_book',
  'remove_book',
  'move_section',
  'enter_shelf',
  'bookmark',
  'create_card',
  'share_card',
  'change_handle',
  // Phase 2+ — remain as stubs throughout Stage 1
  'link_identity',
  'upgrade_tier',
  'update_preferences',
  'ensure_session',
  'add_bookmark',
  'remove_bookmark',
  'delete_card',
  'visit_shelf',
  'leave_shelf',
  'import_books',
];

const stubSchema = z.object({}).passthrough();

function buildStub(kind: IntentKind): IntentHandlerSpec {
  return {
    schema: stubSchema as z.ZodSchema<unknown>,
    mode: 'sync',
    handler: async () => {
      throw new NotImplementedYetError(kind);
    },
  };
}

const registry = new Map<IntentKind, IntentHandlerSpec>();

function seedStubs(): void {
  registry.clear();
  for (const kind of ALL_KINDS) {
    registry.set(kind, buildStub(kind));
  }
}

seedStubs();

export function registerIntent<P, R>(
  kind: IntentKind,
  spec: IntentHandlerSpec<P, R>,
): void {
  registry.set(kind, spec as IntentHandlerSpec<unknown, unknown>);
}

export function getHandler(kind: IntentKind): IntentHandlerSpec | undefined {
  return registry.get(kind);
}

export function listRegisteredKinds(): IntentKind[] {
  return Array.from(registry.keys());
}

/**
 * Test-only: clear the registry and re-seed the 18 stubs. Used by
 * tests that register a handler and need a clean slate before the
 * next case. Underscore prefix marks it as not for production use.
 */
export function _resetForTest(): void {
  seedStubs();
}
