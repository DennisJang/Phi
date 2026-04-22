import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database';
import type {
  Book,
  BookLanguage,
  BookSource,
  CoverSource,
  CreateBookInput,
  ReadingStatus,
} from '@/types/book';
import type { BookRepository } from '@/lib/repository/books';

// --------------------------------------------------------------------
// The Supabase row shape lives here and nowhere else. Domain code
// imports from @/types/book; any new column touching the UI goes
// through rowToBook so the adapter stays the single translation
// boundary between Postgres snake_case and our domain shape.
// --------------------------------------------------------------------

type BookRow = Database['public']['Tables']['books']['Row'];
type BookInsertRow = Database['public']['Tables']['books']['Insert'];

const BOOK_COLUMNS =
  'id, user_id, shelf_id, title, author, isbn, publisher, published_year, ' +
  'total_pages, language, cover_image_url, cover_storage_path, ' +
  'cover_dominant_color, cover_source, spine_image_url, spine_storage_path, ' +
  'shelf_order, section_label, is_section_start, reading_status, is_featured, ' +
  'one_liner, memo, added_to_shelf_at, started_reading_at, completed_at, ' +
  'created_at, updated_at, deleted_at, added_location, added_weather, ' +
  'added_timezone, source, metadata';

function rowToBook(row: BookRow): Book {
  return {
    id: row.id,
    user_id: row.user_id,
    shelf_id: row.shelf_id,

    title: row.title,
    author: row.author,
    isbn: row.isbn,
    publisher: row.publisher,
    published_year: row.published_year,
    total_pages: row.total_pages,
    // DB CHECK restricts to 'ko'|'en'; cast at the boundary
    language: (row.language ?? 'ko') as BookLanguage,

    cover_image_url: row.cover_image_url,
    cover_storage_path: row.cover_storage_path,
    cover_dominant_color: row.cover_dominant_color,
    cover_source: row.cover_source as CoverSource | null,

    spine_image_url: row.spine_image_url,
    spine_storage_path: row.spine_storage_path,

    shelf_order: row.shelf_order,
    section_label: row.section_label,
    is_section_start: row.is_section_start ?? false,

    reading_status: row.reading_status as ReadingStatus,
    is_featured: row.is_featured,
    one_liner: row.one_liner,
    memo: row.memo,

    added_to_shelf_at: row.added_to_shelf_at,
    started_reading_at: row.started_reading_at,
    completed_at: row.completed_at,
    // DB columns are non-null in practice for any row we read, but
    // typed nullable by the generator; fall back to empty string is
    // wrong, so surface the raw value and let the type mirror DB.
    created_at: row.created_at ?? '',
    updated_at: row.updated_at ?? '',
    deleted_at: row.deleted_at,

    added_location: row.added_location as Record<string, unknown> | null,
    added_weather: row.added_weather as Record<string, unknown> | null,
    added_timezone: row.added_timezone,

    source: row.source as BookSource | null,
    metadata: row.metadata as Record<string, unknown> | null,
  };
}

function inputToInsertRow(input: CreateBookInput): BookInsertRow {
  const row: BookInsertRow = {
    user_id: input.userId,
    shelf_id: input.shelfId,
    title: input.title,
    author: input.author,
    isbn: input.isbn,
    publisher: input.publisher,
    published_year: input.publishedYear,
    language: input.language,
    cover_image_url: input.coverImageUrl,
    cover_storage_path: input.coverStoragePath,
    cover_dominant_color: input.coverDominantColor,
    cover_source: input.coverSource,
    spine_image_url: input.spineImageUrl,
    spine_storage_path: input.spineStoragePath,
    source: input.source,
  };

  if (input.shelfOrder !== undefined) row.shelf_order = input.shelfOrder;
  if (input.sectionLabel !== undefined) row.section_label = input.sectionLabel;
  if (input.readingStatus !== undefined) row.reading_status = input.readingStatus;
  if (input.isFeatured !== undefined) row.is_featured = input.isFeatured;
  if (input.oneLiner !== undefined) row.one_liner = input.oneLiner;
  if (input.memo !== undefined) row.memo = input.memo;
  if (input.metadata !== undefined) {
    // Json column — writing through as the database-layer helper accepts
    row.metadata = input.metadata as BookInsertRow['metadata'];
  }

  return row;
}

export function createBookRepository(
  supabase: SupabaseClient<Database>,
): BookRepository {
  return {
    async findByUser(userId: string): Promise<Book[]> {
      const { data, error } = await supabase
        .from('books')
        .select(BOOK_COLUMNS)
        .eq('user_id', userId)
        .is('deleted_at', null)
        .order('added_to_shelf_at', { ascending: false })
        .returns<BookRow[]>();

      if (error) {
        throw new Error(`[bookRepository.findByUser] ${error.message}`);
      }
      return (data ?? []).map(rowToBook);
    },

    async create(input: CreateBookInput): Promise<Book> {
      const { data, error } = await supabase
        .from('books')
        .insert(inputToInsertRow(input))
        .select(BOOK_COLUMNS)
        .returns<BookRow[]>()
        .single();

      if (error || !data) {
        throw new Error(
          `[bookRepository.create] ${error?.message ?? 'insert returned no row'}`,
        );
      }
      return rowToBook(data);
    },

    async deleteAllByUser(userId: string): Promise<void> {
      const { error } = await supabase
        .from('books')
        .update({ deleted_at: new Date().toISOString() })
        .eq('user_id', userId)
        .is('deleted_at', null);

      if (error) {
        throw new Error(`[bookRepository.deleteAllByUser] ${error.message}`);
      }
    },
  };
}
