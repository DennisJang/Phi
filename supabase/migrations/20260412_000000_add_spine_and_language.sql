-- ============================================================================
-- 20260412_000000_add_spine_and_language.sql
--
-- Step 5 closure follow-up: schema support for spine textures and per-book
-- language.
--
-- Context:
--   - Step 5 added /api/spine-generate which produces a deterministic spine
--     PNG → WebP and uploads it under covers/{user_id}/{sha1}.webp via RLS.
--   - PROJECT_KNOWLEDGE.md §9 (Step 5 closure) commits the production flow to
--     "books row carries {coverUrl, spineUrl, dominantHex} pre-computed".
--   - The current books schema has cover_image_url + cover_storage_path but
--     no equivalent for spine, so that flow has nowhere to persist results.
--   - Spine typography routes on language (§6.3, §19.4). Today that
--     information lives only on profiles.language_preference, which forces
--     all of a user's books to share one language. §19.5 explicitly allows
--     per-book language mixing (user writes in their own language; their
--     shelf can hold a Korean translation and an English original).
--
-- Changes:
--   1. books.language — text, default 'ko', CHECK ('ko' | 'en').
--      Mirrors profiles.language_preference shape so existing code reading
--      'ko' | 'en' continues to work. Default matches Phi's primary market.
--   2. books.spine_storage_path — text, nullable. Bucket-internal path
--      ({user_id}/{sha1}.webp), mirroring cover_storage_path's role:
--      used for Storage delete on book removal.
--   3. books.spine_image_url — text, nullable. Full public URL, mirroring
--      cover_image_url's role: consumed directly by the 3D scene.
--
-- Null-safety:
--   - spine columns are nullable because spine generation may fail or lag
--     behind cover upload. The 3D scene treats null spine as "use dev
--     fallback" today, and will treat it as an error after Phase 1 gate.
--   - language default = 'ko' means any existing rows (currently 0) remain
--     valid; new rows that omit the column land on the primary-market
--     default rather than NULL, which keeps spine generation routable.
--
-- RLS:
--   - No RLS changes. Existing "Users manage own books" / "Public books
--     readable" policies cover the new columns automatically because RLS
--     is row-scoped, not column-scoped.
-- ============================================================================

alter table public.books
  add column if not exists language text default 'ko'
    check (language in ('ko', 'en')),
  add column if not exists spine_storage_path text,
  add column if not exists spine_image_url text;

-- No index on spine_storage_path: it is looked up only by book id, never
-- queried independently. cover_storage_path follows the same pattern.