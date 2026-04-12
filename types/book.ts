/**
 * Book — DB row type for the `books` table.
 *
 * Schema source of truth: supabase/migrations/
 *   - 20260410_000000_phi_redesign.sql  (base columns, shelf_order)
 *   - 20260412_000000_add_spine_and_language.sql  (language, spine_*)
 *
 * Nullability: cover_* and spine_* are nullable at DB level (a book can
 * be inserted before its assets exist), but at render time in
 * BookshelfScene we expect them populated — every add-book path
 * (dev-seed, Step 6 Aladin, Step 7 manual) runs the full cover+spine
 * pipeline before INSERT.
 */

export type BookLanguage = 'ko' | 'en';

export type CoverSource = 'aladin' | 'google_books' | 'upload' | 'generate';

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
  total_pages: number | null;
  language: BookLanguage;

  // Cover (pre-computed per §9 Step 5 closure)
  cover_image_url: string | null;
  cover_storage_path: string | null;
  cover_dominant_color: string | null;
  cover_source: CoverSource | null;

  // Spine (pre-computed per §9 Step 5 closure)
  spine_image_url: string | null;
  spine_storage_path: string | null;

  // Shelf arrangement
  shelf_order: number;
  section_label: string | null;
  is_section_start: boolean;

  // Provenance
  source: string | null;
  metadata: Record<string, unknown> | null;

  // Timestamps
  created_at: string;
  updated_at: string;
}