import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database';
import type { ShelfAffinity } from '@/types/shelfAffinity';
import type {
  ShelfAffinityRepository,
  UpsertShelfAffinityInput,
} from '@/lib/repository/shelfAffinities';

type ShelfAffinityRow = Database['public']['Tables']['shelf_affinities']['Row'];
type ShelfAffinityInsertRow =
  Database['public']['Tables']['shelf_affinities']['Insert'];

const SHELF_AFFINITY_COLUMNS =
  'id, visitor_user_id, owner_user_id, visitor_country, created_at, updated_at';

function rowToShelfAffinity(row: ShelfAffinityRow): ShelfAffinity {
  return {
    id: row.id,
    visitorUserId: row.visitor_user_id,
    ownerUserId: row.owner_user_id,
    visitorCountry: row.visitor_country,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function createShelfAffinityRepository(
  supabase: SupabaseClient<Database>,
): ShelfAffinityRepository {
  return {
    async upsert(input: UpsertShelfAffinityInput): Promise<ShelfAffinity> {
      const insertRow: ShelfAffinityInsertRow = {
        visitor_user_id: input.visitorUserId,
        owner_user_id: input.ownerUserId,
        visitor_country: input.visitorCountry ?? null,
      };

      const { data, error } = await supabase
        .from('shelf_affinities')
        .upsert(insertRow, { onConflict: 'visitor_user_id,owner_user_id' })
        .select(SHELF_AFFINITY_COLUMNS)
        .returns<ShelfAffinityRow[]>()
        .single();

      if (error || !data) {
        throw new Error(
          `[shelfAffinityRepository.upsert] ${error?.message ?? 'upsert returned no row'}`,
        );
      }
      return rowToShelfAffinity(data);
    },
  };
}
