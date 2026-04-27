import { describe, it, expect, beforeEach } from 'vitest';
import { z } from 'zod';
import {
  NotImplementedYetError,
  _resetForTest,
  getHandler,
  listRegisteredKinds,
  registerIntent,
  type IntentHandlerSpec,
} from './registry';
import type { IntentKind } from '@/types/intent';

const PHASE_1_ALPHA: IntentKind[] = [
  'add_book',
  'remove_book',
  'move_section',
  'enter_shelf',
  'bookmark',
  'create_card',
  'share_card',
  'change_handle',
];

const PHASE_2_PLUS: IntentKind[] = [
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

beforeEach(() => {
  _resetForTest();
});

describe('initial registry seed', () => {
  it('pre-registers all 18 IntentKinds', () => {
    const kinds = listRegisteredKinds();
    expect(kinds).toHaveLength(18);
    for (const kind of [...PHASE_1_ALPHA, ...PHASE_2_PLUS]) {
      expect(kinds).toContain(kind);
    }
  });

  it('returns a stub spec from getHandler for any seeded kind', () => {
    for (const kind of PHASE_1_ALPHA) {
      const spec = getHandler(kind);
      expect(spec).toBeDefined();
      expect(spec?.mode).toBe('sync');
    }
  });

  it('stub handlers throw NotImplementedYetError carrying the kind', async () => {
    const spec = getHandler('add_book');
    await expect(spec?.handler({}, {} as never)).rejects.toBeInstanceOf(
      NotImplementedYetError,
    );

    try {
      await spec?.handler({}, {} as never);
    } catch (caught) {
      expect(caught).toBeInstanceOf(NotImplementedYetError);
      expect((caught as NotImplementedYetError).kind).toBe('add_book');
      expect((caught as NotImplementedYetError).name).toBe(
        'NotImplementedYetError',
      );
    }
  });

  it('returns undefined for unknown kinds', () => {
    expect(getHandler('not_a_real_kind' as IntentKind)).toBeUndefined();
  });
});

describe('registerIntent', () => {
  it('overrides the stub for the given kind', async () => {
    const productionSpec: IntentHandlerSpec<{ x: number }, { y: number }> = {
      schema: z.object({ x: z.number() }),
      mode: 'async',
      handler: async ({ x }) => ({ y: x * 2 }),
    };

    registerIntent('add_book', productionSpec);
    const spec = getHandler('add_book');

    expect(spec?.mode).toBe('async');
    expect(await spec?.handler({ x: 5 }, {} as never)).toEqual({ y: 10 });
  });

  it('does not affect other kinds', async () => {
    registerIntent('add_book', {
      schema: z.object({}),
      mode: 'sync',
      handler: async () => 'overridden',
    });

    const otherStub = getHandler('remove_book');
    await expect(otherStub?.handler({}, {} as never)).rejects.toBeInstanceOf(
      NotImplementedYetError,
    );
  });
});

describe('_resetForTest', () => {
  it('restores the original stubs after a register call', async () => {
    registerIntent('add_book', {
      schema: z.object({}),
      mode: 'sync',
      handler: async () => 'overridden',
    });
    expect(await getHandler('add_book')?.handler({}, {} as never)).toBe(
      'overridden',
    );

    _resetForTest();

    await expect(
      getHandler('add_book')?.handler({}, {} as never),
    ).rejects.toBeInstanceOf(NotImplementedYetError);
    expect(listRegisteredKinds()).toHaveLength(18);
  });
});
