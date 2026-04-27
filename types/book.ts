/**
 * Book — domain type for the `books` table.
 *
 * Shape matches the authoritative schema on the Supabase server
 * (12th migration `phi_2_0_stage_1_foundation`). Column names stay in
 * snake_case to align with the raw DB rows produced by the
 * Supabase adapter in lib/supabase/repositories/bookRepository.ts;
 * the adapter is the single translation boundary.
 *
 * cover_source values are the DB CHECK values — 'aladin_url',
 * 'user_upload', 'typographic_generated'.
 */

export type BookLanguage = 'ko' | 'en';

export type CoverSource =
  | 'aladin_url'
  | 'user_upload'
  | 'typographic_generated';

export type BookSource = 'aladin_api' | 'manual' | 'google_books';

export type BookSection = 'interested' | 'owned' | 'reading';

export interface Book {
  // Identity
  id: string;
  user_id: string;

  // Content
  title: string;
  author: string | null;
  isbn: string | null;
  publisher: string | null;
  published_year: number | null;
  language: BookLanguage | null;

  // Cover
  cover_source: CoverSource | null;
  cover_dominant_color: string | null;
  cover_sha1: string | null;
  was_cover_fallback: boolean;

  // Derived (not a DB column). Computed by the Supabase adapter from
  // cover_sha1 + the `covers` bucket path convention so callers can
  // render without re-deriving the public URL themselves.
  cover_image_url: string | null;

  // Spine
  spine_image_url: string | null;
  spine_storage_path: string | null;

  // Section + provenance
  section: BookSection;
  source: BookSource | null;
  source_id: string | null;

  // Async write provenance + denormalized aggregates
  intent_id: string | null;
  bookmark_count: number;

  // Timestamps (ISO strings; nullable per DB generator output)
  created_at: string | null;
  updated_at: string | null;
  deleted_at: string | null;
}

/**
 * Input shape for BookRepository.create.
 *
 * Fields callers provide at add-time. Excludes:
 *   - id, created_at, updated_at — DB-generated
 *   - deleted_at — owned by the soft-delete path
 *   - bookmark_count — denormalized aggregate, owned by bookmark
 *     INSERT trigger / handler
 *
 * `section` is optional; omitting it accepts the DB default ('owned').
 * `wasCoverFallback` is optional; omitting it accepts the DB default (false).
 */
export interface CreateBookInput {
  userId: string;

  title: string;
  author: string | null;
  isbn: string | null;
  publisher: string | null;
  publishedYear: number | null;
  language: BookLanguage | null;

  coverSource: CoverSource | null;
  coverDominantColor: string | null;
  coverSha1: string | null;
  wasCoverFallback?: boolean;

  spineImageUrl: string | null;
  spineStoragePath: string | null;

  section?: BookSection;
  source: BookSource | null;
  sourceId?: string | null;
  intentId?: string | null;
}
