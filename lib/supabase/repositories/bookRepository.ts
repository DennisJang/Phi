import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database';
import type {
  Book,
  BookLanguage,
  BookSection,
  BookSource,
  CoverSource,
  CreateBookInput,
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

const COVER_BUCKET = 'covers';

const BOOK_COLUMNS =
  'id, user_id, title, author, isbn, publisher, published_year, language, ' +
  'cover_source, cover_dominant_color, cover_sha1, was_cover_fallback, ' +
  'spine_image_url, spine_storage_path, ' +
  'section, source, source_id, intent_id, bookmark_count, ' +
  'created_at, updated_at, deleted_at';

function rowToBook(
  row: BookRow,
  supabase: SupabaseClient<Database>,
): Book {
  // cover_image_url is derived from cover_sha1 + the covers bucket
  // path convention `{userId}/{sha1}.webp`. The adapter is the only
  // layer that knows about the bucket; downstream code reads
  // book.cover_image_url like any other field.
  const coverImageUrl = row.cover_sha1
    ? supabase.storage
        .from(COVER_BUCKET)
        .getPublicUrl(`${row.user_id}/${row.cover_sha1}.webp`).data.publicUrl
    : null;

  return {
    id: row.id,
    user_id: row.user_id,

    title: row.title,
    author: row.author,
    isbn: row.isbn,
    publisher: row.publisher,
    published_year: row.published_year,
    language: row.language as BookLanguage | null,

    cover_source: row.cover_source as CoverSource | null,
    cover_dominant_color: row.cover_dominant_color,
    cover_sha1: row.cover_sha1,
    was_cover_fallback: row.was_cover_fallback,
    cover_image_url: coverImageUrl,

    spine_image_url: row.spine_image_url,
    spine_storage_path: row.spine_storage_path,

    section: row.section as BookSection,
    source: row.source as BookSource | null,
    source_id: row.source_id,
    intent_id: row.intent_id,
    bookmark_count: row.bookmark_count,

    created_at: row.created_at,
    updated_at: row.updated_at,
    deleted_at: row.deleted_at,
  };
}

function inputToInsertRow(input: CreateBookInput): BookInsertRow {
  const row: BookInsertRow = {
    user_id: input.userId,
    title: input.title,
    author: input.author,
    isbn: input.isbn,
    publisher: input.publisher,
    published_year: input.publishedYear,
    language: input.language,

    cover_source: input.coverSource,
    cover_dominant_color: input.coverDominantColor,
    cover_sha1: input.coverSha1,

    spine_image_url: input.spineImageUrl,
    spine_storage_path: input.spineStoragePath,

    source: input.source,
  };

  if (input.section !== undefined) row.section = input.section;
  if (input.wasCoverFallback !== undefined) {
    row.was_cover_fallback = input.wasCoverFallback;
  }
  if (input.sourceId !== undefined) row.source_id = input.sourceId;
  if (input.intentId !== undefined) row.intent_id = input.intentId;

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
        .order('created_at', { ascending: false })
        .returns<BookRow[]>();

      if (error) {
        throw new Error(`[bookRepository.findByUser] ${error.message}`);
      }
      return (data ?? []).map((row) => rowToBook(row, supabase));
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
      return rowToBook(data, supabase);
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
