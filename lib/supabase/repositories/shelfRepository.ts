import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database';
import type { Shelf, ShelfKind, ShelfVisibility } from '@/types/shelf';
import type { ShelfRepository } from '@/lib/repository/shelves';

type ShelfRow = Database['public']['Tables']['shelves']['Row'];

const SHELF_COLUMNS =
  'id, user_id, name, kind, visibility, is_default, created_at, updated_at';

function rowToShelf(row: ShelfRow): Shelf {
  return {
    id: row.id,
    userId: row.user_id,
    name: row.name,
    kind: row.kind as ShelfKind,
    visibility: row.visibility as ShelfVisibility,
    isDefault: row.is_default,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function createShelfRepository(
  supabase: SupabaseClient<Database>,
): ShelfRepository {
  return {
    async findDefaultLibraryByUser(userId: string): Promise<Shelf | null> {
      const { data, error } = await supabase
        .from('shelves')
        .select(SHELF_COLUMNS)
        .eq('user_id', userId)
        .eq('kind', 'library')
        .eq('is_default', true)
        .returns<ShelfRow[]>()
        .maybeSingle();

      if (error) {
        throw new Error(
          `[shelfRepository.findDefaultLibraryByUser] ${error.message}`,
        );
      }
      return data ? rowToShelf(data) : null;
    },

    async findAllByUser(userId: string): Promise<Shelf[]> {
      const { data, error } = await supabase
        .from('shelves')
        .select(SHELF_COLUMNS)
        .eq('user_id', userId)
        .order('created_at', { ascending: true })
        .returns<ShelfRow[]>();

      if (error) {
        throw new Error(`[shelfRepository.findAllByUser] ${error.message}`);
      }
      return (data ?? []).map(rowToShelf);
    },
  };
}
