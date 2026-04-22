/**
 * Book — domain type for the `books` table.
 *
 * Shape matches the authoritative schema on the Supabase server
 * (see .claude/ARCHITECTURE.md → Database). Column names stay in
 * snake_case to align with the raw DB rows produced by the
 * Supabase adapter in lib/supabase/repositories/bookRepository.ts;
 * the adapter is the only layer that knows they come from Postgres.
 *
 * cover_source values are the DB CHECK values — 'aladin_url',
 * 'user_upload', 'typographic_generated'. Phase 2 migration extends
 * this set with 'google_books_url'.
 *
 * Nullability: cover_* and spine_* are nullable at DB level (a book
 * can be inserted before its assets exist), but at render time in
 * BookshelfScene we expect them populated — every add-book path
 * (dev-seed, Aladin, Phase 2 manual) runs the full cover+spine
 * pipeline before INSERT.
 */

export type BookLanguage = 'ko' | 'en';

export type CoverSource =
  | 'aladin_url'
  | 'user_upload'
  | 'typographic_generated';

export type BookSource = 'aladin_api' | 'manual' | 'google_books';

export type ReadingStatus =
  | 'interested'
  | 'owned'
  | 'reading'
  | 'completed'
  | 'abandoned';

export interface Book {
  // Identity
  id: string;
  user_id: string;
  shelf_id: string;

  // Content
  title: string;
  author: string | null;
  isbn: string | null;
  publisher: string | null;
  published_year: number | null;
  total_pages: number | null;
  language: BookLanguage;

  // Cover
  cover_image_url: string | null;
  cover_storage_path: string | null;
  cover_dominant_color: string | null;
  cover_source: CoverSource | null;

  // Spine
  spine_image_url: string | null;
  spine_storage_path: string | null;

  // Shelf arrangement
  shelf_order: number | null;
  section_label: string | null;
  is_section_start: boolean;

  // Reading state
  reading_status: ReadingStatus;
  is_featured: boolean;
  one_liner: string | null;
  memo: string | null;

  // Timestamps (ISO strings)
  added_to_shelf_at: string;
  started_reading_at: string | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;

  // Contextual capture
  added_location: Record<string, unknown> | null;
  added_weather: Record<string, unknown> | null;
  added_timezone: string | null;

  // Provenance
  source: BookSource | null;
  metadata: Record<string, unknown> | null;
}

/**
 * Input shape for BookRepository.create.
 *
 * Fields callers provide at add-time. Excludes:
 *   - id, created_at, updated_at, added_to_shelf_at — DB-generated
 *   - deleted_at — owned by the soft-delete path
 *   - started_reading_at, completed_at — auto-stamped by triggers
 *
 * reading_status is optional; omitting it accepts the DB default
 * (`owned`) which matches the Phase 1 default-add flow.
 */
export interface CreateBookInput {
  userId: string;
  shelfId: string;

  title: string;
  author: string | null;
  isbn: string | null;
  publisher: string | null;
  publishedYear: number | null;
  language: BookLanguage;

  coverImageUrl: string | null;
  coverStoragePath: string | null;
  coverDominantColor: string | null;
  coverSource: CoverSource | null;

  spineImageUrl: string | null;
  spineStoragePath: string | null;

  shelfOrder?: number | null;
  sectionLabel?: string | null;

  readingStatus?: ReadingStatus;
  isFeatured?: boolean;
  oneLiner?: string | null;
  memo?: string | null;

  source: BookSource | null;
  metadata?: Record<string, unknown> | null;
}
