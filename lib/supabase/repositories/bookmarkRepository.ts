import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database';
import type { Bookmark } from '@/types/bookmark';
import type {
  BookmarkRepository,
  CreateBookmarkInput,
} from '@/lib/repository/bookmarks';

type BookmarkRow = Database['public']['Tables']['bookmarks']['Row'];
type BookmarkInsertRow = Database['public']['Tables']['bookmarks']['Insert'];

const BOOKMARK_COLUMNS =
  'id, user_id, book_id, visitor_country, created_at, updated_at';

function rowToBookmark(row: BookmarkRow): Bookmark {
  return {
    id: row.id,
    userId: row.user_id,
    bookId: row.book_id,
    visitorCountry: row.visitor_country,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function createBookmarkRepository(
  supabase: SupabaseClient<Database>,
): BookmarkRepository {
  return {
    async create(input: CreateBookmarkInput): Promise<Bookmark> {
      const insertRow: BookmarkInsertRow = {
        user_id: input.userId,
        book_id: input.bookId,
        visitor_country: input.visitorCountry ?? null,
      };

      const { data, error } = await supabase
        .from('bookmarks')
        .insert(insertRow)
        .select(BOOKMARK_COLUMNS)
        .returns<BookmarkRow[]>()
        .single();

      if (error || !data) {
        throw new Error(
          `[bookmarkRepository.create] ${error?.message ?? 'insert returned no row'}`,
        );
      }
      return rowToBookmark(data);
    },

    async findByVisitorAndBook(
      userId: string,
      bookId: string,
    ): Promise<Bookmark | null> {
      const { data, error } = await supabase
        .from('bookmarks')
        .select(BOOKMARK_COLUMNS)
        .eq('user_id', userId)
        .eq('book_id', bookId)
        .returns<BookmarkRow[]>()
        .maybeSingle();

      if (error) {
        throw new Error(`[bookmarkRepository.findByVisitorAndBook] ${error.message}`);
      }
      return data ? rowToBookmark(data) : null;
    },

    async delete(id: string): Promise<void> {
      const { error } = await supabase.from('bookmarks').delete().eq('id', id);
      if (error) {
        throw new Error(`[bookmarkRepository.delete] ${error.message}`);
      }
    },
  };
}
