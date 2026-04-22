/**
 * POST /api/books/create-from-metadata
 *
 * Body: { metadata: BookMetadata }
 * Returns: { bookId, coverUrl, spineUrl, dominantColor, shelfOrder }
 *
 * The pipeline that every add-book path (Aladin search, Google Books
 * search, manual entry) eventually flows through. Takes a validated
 * BookMetadata, runs the cover/spine/insert pipeline, returns a book.
 *
 * Source-agnostic by design
 * -------------------------
 * This route never imports from lib/aladin/ or any specific source
 * adapter. The source field on BookMetadata is just a value — the
 * pipeline cares only about the shape. When Phase 2 adds Google Books,
 * /api/google-books/search will produce BookMetadata and call this
 * route without requiring any change here (modulo the cover_source
 * CHECK migration noted below).
 *
 * Phase 1 scope restriction
 * -------------------------
 * Only source='aladin' is accepted right now.
 *   - 'google_books': the DB CHECK on books.cover_source does not yet
 *     include 'google_books_url'; that is a Phase 2 migration. The
 *     mapping helper below is already written for Phase 2, but early-
 *     returning 400 here prevents an INSERT that would violate the
 *     constraint and produce a cryptic error.
 *   - 'manual':     the add-book UI (Step 7) doesn't exist yet. Open
 *     this branch when the UI lands, together with a cover-required
 *     / typographic-fallback decision.
 *
 * Pipeline
 * --------
 * 1. auth -> userId
 * 2. JSON + zod validate body
 * 3. Phase 1 source gate
 * 4. fetchRemoteImage(coverOriginalUrl) -> raw bytes
 * 5. processImage -> webp + dominantColor
 * 6. Storage upload -> covers/{userId}/{sha1}.webp
 * 7. renderSpine({title, author, language, coverBaseColor}) -> png
 * 8. processImage(spinePng) -> webp
 * 9. Storage upload
 * 10. SELECT MAX(shelf_order) for user
 * 11. INSERT books row
 * 12. return bookId + public URLs
 *
 * Concurrency note: step 10 + step 11 are not atomic, so two rapid
 * add-book calls from the same user can race and assign duplicate
 * shelf_order values. That is visually harmless (two books render at
 * the same slot and one wins the z-sort) and will be addressed when
 * Phase 2 adds proper shelf reordering.
 */

import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { createServerRepositories } from '@/lib/repository/server';
import { fetchRemoteImage } from '@/lib/image/fetchRemoteImage';
import { processImage } from '@/lib/image/processImage';
import { hashImageBytes } from '@/lib/image/hash';
import { renderSpine } from '@/lib/three/spineGenerator';
import type { BookSource, CoverSource } from '@/types/book';
import type { MetadataSource } from '@/types/metadata';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const BUCKET = 'covers';

const BookMetadataSchema = z.object({
  source: z.enum(['aladin', 'google_books', 'manual']),
  sourceItemId: z.string().trim().min(1).max(100),
  isbn: z.string().trim().min(10).max(20).nullable(),
  title: z.string().trim().min(1).max(500),
  author: z.string().trim().min(1).max(500),
  publisher: z.string().trim().max(200).nullable(),
  publishedYear: z.number().int().min(1000).max(3000).nullable(),
  language: z.enum(['ko', 'en']),
  coverOriginalUrl: z.string().url().nullable(),
  sourceLink: z.string().url().nullable(),
});

const RequestSchema = z.object({
  metadata: BookMetadataSchema,
});

export async function POST(request: Request): Promise<NextResponse> {
  // 1. Auth
  const supabase = await createClient();
  const { data: userData, error: userErr } = await supabase.auth.getUser();
  if (userErr || !userData.user) {
    return errResponse(401, 'unauthenticated', 'sign in first');
  }
  const userId = userData.user.id;

  // 2. Parse body
  let body: unknown;
  try {
    body = await request.json();
  } catch (e) {
    return errResponse(
      400,
      'invalid_json',
      e instanceof Error ? e.message : 'request body is not JSON',
    );
  }

  const parsed = RequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      {
        ok: false,
        error: { kind: 'invalid_metadata', issues: parsed.error.flatten() },
      },
      { status: 400 },
    );
  }
  const { metadata } = parsed.data;

  // 3. Phase 1 source gate
  if (metadata.source !== 'aladin') {
    return errResponse(
      400,
      'unsupported_source',
      `Phase 1 only supports source='aladin'; received '${metadata.source}'`,
    );
  }

  // 4. Cover is required for Aladin in Phase 1
  if (!metadata.coverOriginalUrl) {
    return errResponse(
      400,
      'missing_cover_url',
      'Aladin metadata must include coverOriginalUrl',
    );
  }

  // 5. Fetch remote cover
  const coverFetch = await fetchRemoteImage(metadata.coverOriginalUrl);
  if (!coverFetch.ok) {
    return NextResponse.json(
      {
        ok: false,
        error: {
          kind: `cover_fetch_${coverFetch.error.kind}`,
          message: coverFetch.error.message,
        },
      },
      { status: 502 },
    );
  }

  // 6. Process cover -> WebP + dominantColor
  const coverProcessed = await processImage(coverFetch.buffer);
  if (!coverProcessed.ok) {
    return errResponse(
      500,
      `cover_process_${coverProcessed.error.kind}`,
      coverProcessed.error.message,
    );
  }
  const cover = coverProcessed.data;

  // 7. Upload cover under RLS-scoped path
  const coverHash = hashImageBytes(cover.webpBuffer);
  const coverPath = `${userId}/${coverHash}.webp`;
  const { error: coverUploadErr } = await supabase.storage
    .from(BUCKET)
    .upload(coverPath, cover.webpBuffer, {
      contentType: 'image/webp',
      cacheControl: '31536000',
      upsert: true,
    });
  if (coverUploadErr) {
    return errResponse(500, 'cover_upload_failed', coverUploadErr.message);
  }
  const { data: coverUrlData } = supabase.storage.from(BUCKET).getPublicUrl(coverPath);

  // 8. Render spine (direct lib call — no HTTP round-trip)
  const spineRender = renderSpine({
    title: metadata.title,
    author: metadata.author,
    language: metadata.language,
    coverBaseColor: cover.dominantColor,
  });
  if (!spineRender.ok) {
    return errResponse(
      500,
      `spine_render_${spineRender.error.kind}`,
      spineRender.error.message,
    );
  }

  // 9. Process spine PNG -> WebP
  const spineProcessed = await processImage(spineRender.png);
  if (!spineProcessed.ok) {
    return errResponse(
      500,
      `spine_process_${spineProcessed.error.kind}`,
      spineProcessed.error.message,
    );
  }
  const spine = spineProcessed.data;

  // 10. Upload spine
  const spineHash = hashImageBytes(spine.webpBuffer);
  const spinePath = `${userId}/${spineHash}.webp`;
  const { error: spineUploadErr } = await supabase.storage
    .from(BUCKET)
    .upload(spinePath, spine.webpBuffer, {
      contentType: 'image/webp',
      cacheControl: '31536000',
      upsert: true,
    });
  if (spineUploadErr) {
    return errResponse(500, 'spine_upload_failed', spineUploadErr.message);
  }
  const { data: spineUrlData } = supabase.storage.from(BUCKET).getPublicUrl(spinePath);

  // 11. Resolve the user's default library shelf (insert target) and
  //     determine next shelf_order. Both go through the repository;
  //     auth and storage above stay on the direct client.
  const { books: booksRepo, shelves: shelvesRepo } =
    await createServerRepositories();

  const defaultShelf = await shelvesRepo.findDefaultLibraryByUser(userId);
  if (!defaultShelf) {
    return errResponse(
      500,
      'default_shelf_missing',
      'User has no default library shelf; profile trigger may not have run',
    );
  }

  // The domain API folds the "append to end" convention inside the
  // route; a future Step 7 redesign may drop shelf_order for
  // added_to_shelf_at ordering entirely.
  const existing = await booksRepo.findByUser(userId);
  const maxShelfOrder = existing.reduce(
    (acc, b) => (b.shelf_order !== null && b.shelf_order > acc ? b.shelf_order : acc),
    -1,
  );
  const nextShelfOrder = maxShelfOrder + 1;

  // 12. INSERT via repository
  let inserted;
  try {
    inserted = await booksRepo.create({
      userId,
      shelfId: defaultShelf.id,
      title: metadata.title,
      author: metadata.author,
      isbn: metadata.isbn,
      publisher: metadata.publisher,
      publishedYear: metadata.publishedYear,
      language: metadata.language,
      coverImageUrl: coverUrlData.publicUrl,
      coverStoragePath: coverPath,
      coverDominantColor: cover.dominantColor,
      coverSource: mapCoverSourceToDb(metadata.source),
      spineImageUrl: spineUrlData.publicUrl,
      spineStoragePath: spinePath,
      shelfOrder: nextShelfOrder,
      source: mapSourceToDb(metadata.source),
      // JSONB preserves source-specific fields for Phase 2 dedup + re-fetch.
      metadata: {
        sourceItemId: metadata.sourceItemId,
        sourceLink: metadata.sourceLink,
      },
    });
  } catch (err) {
    return errResponse(
      500,
      'books_insert_failed',
      err instanceof Error ? err.message : 'insert failed',
    );
  }

  return NextResponse.json({
    ok: true,
    data: {
      bookId: inserted.id,
      coverUrl: coverUrlData.publicUrl,
      spineUrl: spineUrlData.publicUrl,
      dominantColor: cover.dominantColor,
      shelfOrder: nextShelfOrder,
    },
  });
}

/**
 * BookMetadata.source -> books.source value.
 * Phase 2 will exercise 'google_books' and 'manual' branches.
 */
function mapSourceToDb(source: MetadataSource): BookSource {
  switch (source) {
    case 'aladin':
      return 'aladin_api';
    case 'google_books':
      return 'google_books';
    case 'manual':
      return 'manual';
  }
}

/**
 * BookMetadata.source -> books.cover_source value.
 *
 * Phase 2 migration required: current CHECK on books.cover_source is
 * {'aladin_url', 'user_upload', 'typographic_generated'}. Adding
 * Google Books support means a migration that extends the set to
 * include 'google_books_url'. Until then, the source gate in POST()
 * rejects google_books before it reaches INSERT; the 'google_books_url'
 * branch below is cast-to-CoverSource in anticipation of that migration.
 */
function mapCoverSourceToDb(source: MetadataSource): CoverSource {
  switch (source) {
    case 'aladin':
      return 'aladin_url';
    case 'google_books':
      return 'google_books_url' as CoverSource;
    case 'manual':
      return 'user_upload';
  }
}

function errResponse(status: number, kind: string, message: string): NextResponse {
  return NextResponse.json(
    { ok: false, error: { kind, message } },
    { status },
  );
}