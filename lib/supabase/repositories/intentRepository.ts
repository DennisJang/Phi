import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database';
import type { Intent, IntentKind, IntentState } from '@/types/intent';
import type {
  IntentRepository,
  CreateIntentInput,
} from '@/lib/repository/intents';

type IntentRow = Database['public']['Tables']['intents']['Row'];
type IntentInsertRow = Database['public']['Tables']['intents']['Insert'];

const INTENT_COLUMNS =
  'id, kind, actor_id, idempotency_key, trigger_source, ' +
  'state, params, progress, result, error, ' +
  'retry_count, next_retry_at, started_at, updated_at, completed_at';

function rowToIntent(row: IntentRow): Intent {
  return {
    id: row.id,
    kind: row.kind as IntentKind,
    actorId: row.actor_id,
    idempotencyKey: row.idempotency_key,
    triggerSource: row.trigger_source,
    state: row.state as IntentState,
    params: (row.params ?? {}) as Record<string, unknown>,
    progress: (row.progress ?? {}) as Record<string, unknown>,
    result: row.result as Record<string, unknown> | null,
    error: row.error as Record<string, unknown> | null,
    retryCount: row.retry_count,
    nextRetryAt: row.next_retry_at,
    startedAt: row.started_at,
    updatedAt: row.updated_at,
    completedAt: row.completed_at,
  };
}

export function createIntentRepository(
  supabase: SupabaseClient<Database>,
): IntentRepository {
  async function returnSingle(
    promise: PromiseLike<{ data: IntentRow | null; error: { message: string } | null }>,
    label: string,
  ): Promise<Intent> {
    const { data, error } = await promise;
    if (error || !data) {
      throw new Error(
        `[${label}] ${error?.message ?? 'update returned no row'}`,
      );
    }
    return rowToIntent(data);
  }

  return {
    async create(input: CreateIntentInput): Promise<Intent> {
      const insertRow: IntentInsertRow = {
        kind: input.kind,
        actor_id: input.actorId,
        idempotency_key: input.idempotencyKey,
        trigger_source: input.triggerSource ?? null,
        params: input.params as IntentInsertRow['params'],
      };
      if (input.state !== undefined) insertRow.state = input.state;

      const { data, error } = await supabase
        .from('intents')
        .insert(insertRow)
        .select(INTENT_COLUMNS)
        .returns<IntentRow[]>()
        .single();

      if (error || !data) {
        throw new Error(
          `[intentRepository.create] ${error?.message ?? 'insert returned no row'}`,
        );
      }
      return rowToIntent(data);
    },

    async findById(id: string): Promise<Intent | null> {
      const { data, error } = await supabase
        .from('intents')
        .select(INTENT_COLUMNS)
        .eq('id', id)
        .returns<IntentRow[]>()
        .maybeSingle();

      if (error) {
        throw new Error(`[intentRepository.findById] ${error.message}`);
      }
      return data ? rowToIntent(data) : null;
    },

    async findByIdempotencyKey(
      actorId: string,
      kind: IntentKind,
      idempotencyKey: string,
    ): Promise<Intent | null> {
      const { data, error } = await supabase
        .from('intents')
        .select(INTENT_COLUMNS)
        .eq('actor_id', actorId)
        .eq('kind', kind)
        .eq('idempotency_key', idempotencyKey)
        .is('completed_at', null)
        .returns<IntentRow[]>()
        .maybeSingle();

      if (error) {
        throw new Error(
          `[intentRepository.findByIdempotencyKey] ${error.message}`,
        );
      }
      return data ? rowToIntent(data) : null;
    },

    async transitionState(id: string, newState: IntentState): Promise<Intent> {
      return returnSingle(
        supabase
          .from('intents')
          .update({
            state: newState,
            updated_at: new Date().toISOString(),
          })
          .eq('id', id)
          .select(INTENT_COLUMNS)
          .returns<IntentRow[]>()
          .single(),
        'intentRepository.transitionState',
      );
    },

    async completeWithResult(
      id: string,
      result: Record<string, unknown>,
    ): Promise<Intent> {
      const now = new Date().toISOString();
      return returnSingle(
        supabase
          .from('intents')
          .update({
            state: 'succeeded',
            result: result as IntentInsertRow['result'],
            completed_at: now,
            updated_at: now,
          })
          .eq('id', id)
          .select(INTENT_COLUMNS)
          .returns<IntentRow[]>()
          .single(),
        'intentRepository.completeWithResult',
      );
    },

    async completeWithError(
      id: string,
      error: Record<string, unknown>,
    ): Promise<Intent> {
      const now = new Date().toISOString();
      return returnSingle(
        supabase
          .from('intents')
          .update({
            state: 'failed',
            error: error as IntentInsertRow['error'],
            completed_at: now,
            updated_at: now,
          })
          .eq('id', id)
          .select(INTENT_COLUMNS)
          .returns<IntentRow[]>()
          .single(),
        'intentRepository.completeWithError',
      );
    },
  };
}
