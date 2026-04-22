import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { createServerRepositories } from '@/lib/repository/server';
import type { BookRepository } from '@/lib/repository/books';
import { processImage } from '@/lib/image/processImage';
import { hashImageBytes } from '@/lib/image/hash';
import { renderSpine } from '@/lib/three/spineGenerator';

// ============================================================================
// POST /api/dev/seed
//
// Purpose
// -------
// Dev-only batch seed: wipe all books owned by DEV_FIXED_USER_ID, then
// insert a fresh set provided as a multipart upload (JSON manifest +
// cover image files). Used for populating the developer's shelf during
// Phase 1 spine typography tuning and end-to-end smoke tests.
//
// Why wipe-then-insert instead of upsert
// --------------------------------------
// Dev seed is a reset primitive, not an incremental sync. Tuning cycles
// typically look like "change a font weight, re-seed, eyeball the shelf,
// repeat". Upsert semantics would leave stale rows behind when a book is
// removed from the manifest or renamed. Full wipe per call matches the
// mental model.
//
// Scope is strictly user_id = DEV_FIXED_USER_ID. Other users' data is
// never touched. Storage objects are not deleted (content-addressed by
// sha1, so dangling WebP files are harmless dev clutter that GC in
// Phase 2 will eventually address).
//
// Security posture
// ----------------
// Three gates, identical pattern to /api/dev/login:
//
//   1. NODE_ENV !== 'development'              → 404
//   2. DEV_FIXED_USER_ID env missing           → 404
//   3. getUser().id !== DEV_FIXED_USER_ID      → 403
//
// The third gate catches the case where a developer forgot to log in as
// the fixed user and is running on an anonymous session — wiping an
// anon's books is not what we intend, and it would also succeed silently
// (anon has RLS write on its own rows) without this check.
//
// Per-book pipeline
// -----------------
// For each entry in the manifest:
//
//   1. Look up the File by coverFilename.
//   2. processImage(coverBytes) → { webpBuffer, dominantColor, w, h }
//   3. Upload cover under covers/{userId}/{sha1}.webp via RLS.
//   4. renderSpine({ title, author, language, coverBaseColor: dominantColor })
//      — direct lib import, no HTTP round-trip to /api/spine-generate.
//   5. processImage(spinePng) → WebP.
//   6. Upload spine under covers/{userId}/{sha1}.webp via RLS.
//   7. INSERT INTO books with language, source='manual', shelf_order = i,
//      cover_* columns from step 2-3, spine_* columns from step 5-6.
//
// Each seedOneBook call is wrapped in try-catch in the driver loop so
// that any unexpected throw lands in `failed` with kind='unexpected_throw'
// rather than aborting the batch. This was added during the initial
// dev-seed smoke test where an uninstrumented pipeline silently produced
// `succeeded=0, failed=0` — a shape that only makes sense if a throw
// escaped the Result-pattern surface. The defensive catch keeps the
// batch observable even when an inner helper misbehaves.
//
// Response shape
// --------------
//   { ok: true, deletedPriorCount, succeeded[], failed[] }
//
//   Status is 200 even when some books fail, because the batch as a
//   whole did partial work successfully. A wholesale abort (bad JSON,
//   missing files, unauthorized) returns 4xx/5xx without a body of
//   succeeded/failed.
// ============================================================================

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const BUCKET = 'covers';
const MAX_BOOKS = 50;
const MAX_BYTES_PER_FILE = 5 * 1024 * 1024;
const ALLOWED_MIME = new Set(['image/jpeg', 'image/png', 'image/webp']);

const ManifestEntrySchema = z.object({
  title: z.string().trim().min(1).max(200),
  author: z.string().trim().min(1).max(200),
  language: z.enum(['ko', 'en']),
  coverFilename: z.string().trim().min(1).max(200),
  isbn: z.string().trim().min(10).max(20).optional(),
  publisher: z.string().trim().min(1).max(200).optional(),
  publishedYear: z.number().int().min(1000).max(3000).optional(),
});

const ManifestSchema = z.object({
  books: z.array(ManifestEntrySchema).min(1).max(MAX_BOOKS),
});

type ManifestEntry = z.infer<typeof ManifestEntrySchema>;

interface SuccessfulBook {
  index: number;
  bookId: string;
  title: string;
  coverUrl: string;
  spineUrl: string;
}

interface FailedBook {
  index: number;
  title: string;
  error: { kind: string; message: string };
}

export async function POST(request: Request): Promise<NextResponse> {
  if (process.env.NODE_ENV !== 'development') {
    return NextResponse.json({ error: 'not found' }, { status: 404 });
  }

  const fixedUserId = process.env.DEV_FIXED_USER_ID;
  if (!fixedUserId) {
    return NextResponse.json({ error: 'not found' }, { status: 404 });
  }

  const supabase = await createClient();
  const { data: userData, error: userErr } = await supabase.auth.getUser();
  if (userErr || !userData.user) {
    return errorResponse(401, 'unauthenticated', 'Sign in via /api/dev/login first');
  }
  if (userData.user.id !== fixedUserId) {
    return errorResponse(
      403,
      'wrong_user',
      `Expected DEV_FIXED_USER_ID=${fixedUserId}, got ${userData.user.id}`,
    );
  }
  const userId = userData.user.id;

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch (err) {
    return errorResponse(
      400,
      'invalid_form_data',
      err instanceof Error ? err.message : 'Failed to parse multipart body',
    );
  }

  const manifestRaw = formData.get('manifest');
  if (typeof manifestRaw !== 'string') {
    return errorResponse(
      400,
      'missing_manifest',
      'Form field "manifest" is required and must be a JSON string',
    );
  }

  let manifestParsed: unknown;
  try {
    manifestParsed = JSON.parse(manifestRaw);
  } catch (err) {
    return errorResponse(
      400,
      'manifest_parse_failed',
      err instanceof Error ? err.message : 'manifest is not valid JSON',
    );
  }

  const validation = ManifestSchema.safeParse(manifestParsed);
  if (!validation.success) {
    return NextResponse.json(
      {
        ok: false,
        error: { kind: 'manifest_validation', issues: validation.error.flatten() },
      },
      { status: 400 },
    );
  }
  const manifest = validation.data;

  // Build a filename-keyed map for O(1) lookup.
  // FormData.getAll('covers') returns [File, File, ...] preserving append
  // order; we key by file.name (which equals the browser's upload filename).
  const coverEntries = formData.getAll('covers');
  const coversByName = new Map<string, File>();
  for (const entry of coverEntries) {
    if (typeof entry === 'string') continue;
    const file = entry as File;
    // Last-write-wins on duplicate filenames. The UI should prevent this
    // upstream but we don't want to hard-fail on it server-side.
    coversByName.set(file.name, file);
  }

  // Domain data access goes through the repository; auth above and
  // storage inside seedOneBook stay on the direct client for now
  // (Step 6.5 scopes the boundary to data access only).
  const { books: booksRepo, shelves: shelvesRepo } =
    await createServerRepositories();

  // Resolve the insert-target shelf up front; a missing default
  // library shelf means the profile bootstrap trigger has not run
  // and the seed cannot proceed.
  const defaultShelf = await shelvesRepo.findDefaultLibraryByUser(userId);
  if (!defaultShelf) {
    return errorResponse(
      500,
      'default_shelf_missing',
      'User has no default library shelf; cannot seed books',
    );
  }

  // Soft-wipe Dennis's existing books. The repository sets deleted_at
  // on every live row; subsequent findByUser calls filter them out.
  // Storage objects are content-addressed by sha1 and left untouched;
  // Phase 2 Storage GC will reclaim dangling WebPs.
  const priorBooks = await booksRepo.findByUser(userId);
  const deletedPriorCount = priorBooks.length;
  if (deletedPriorCount > 0) {
    try {
      await booksRepo.deleteAllByUser(userId);
    } catch (err) {
      return errorResponse(
        500,
        'wipe_failed',
        err instanceof Error ? err.message : 'failed to clear prior books',
      );
    }
  }

  // Per-book pipeline.
  const succeeded: SuccessfulBook[] = [];
  const failed: FailedBook[] = [];

  for (let i = 0; i < manifest.books.length; i++) {
    const entry = manifest.books[i];
    try {
      const result = await seedOneBook({
        entry,
        index: i,
        shelfOrder: i,
        userId,
        shelfId: defaultShelf.id,
        coversByName,
        supabase,
        booksRepo,
      });

      if (result.ok) {
        succeeded.push(result.book);
      } else {
        failed.push({
          index: i,
          title: entry.title,
          error: result.error,
        });
      }
    } catch (thrownErr) {
      // Catch unexpected throws so the batch continues and the failure
      // is visible in the response. See rationale in the header block.
      failed.push({
        index: i,
        title: entry.title,
        error: {
          kind: 'unexpected_throw',
          message: thrownErr instanceof Error ? thrownErr.message : String(thrownErr),
        },
      });
    }
  }

  return NextResponse.json({
    ok: true,
    deletedPriorCount,
    succeeded,
    failed,
  });
}

// ============================================================================
// Per-book worker
// ============================================================================

interface SeedOneInput {
  entry: ManifestEntry;
  index: number;
  shelfOrder: number;
  userId: string;
  shelfId: string;
  coversByName: Map<string, File>;
  supabase: Awaited<ReturnType<typeof createClient>>;
  booksRepo: BookRepository;
}

type SeedOneResult =
  | { ok: true; book: SuccessfulBook }
  | { ok: false; error: { kind: string; message: string } };

async function seedOneBook(input: SeedOneInput): Promise<SeedOneResult> {
  const { entry, index, shelfOrder, userId, shelfId, coversByName, supabase, booksRepo } = input;

  const coverFile = coversByName.get(entry.coverFilename);
  if (!coverFile) {
    return {
      ok: false,
      error: {
        kind: 'cover_file_missing',
        message: `No uploaded file matches coverFilename "${entry.coverFilename}"`,
      },
    };
  }

  if (coverFile.size === 0) {
    return { ok: false, error: { kind: 'cover_empty', message: 'cover file is empty' } };
  }
  if (coverFile.size > MAX_BYTES_PER_FILE) {
    return {
      ok: false,
      error: {
        kind: 'cover_too_large',
        message: `${coverFile.size} bytes exceeds ${MAX_BYTES_PER_FILE}`,
      },
    };
  }
  if (!ALLOWED_MIME.has(coverFile.type)) {
    return {
      ok: false,
      error: {
        kind: 'cover_invalid_mime',
        message: `"${coverFile.type}" is not in the allowed set`,
      },
    };
  }

  let coverBuffer: Buffer;
  try {
    coverBuffer = Buffer.from(await coverFile.arrayBuffer());
  } catch (err) {
    return {
      ok: false,
      error: {
        kind: 'cover_read_failed',
        message: err instanceof Error ? err.message : 'failed to read cover bytes',
      },
    };
  }

  const coverProcessed = await processImage(coverBuffer);
  if (!coverProcessed.ok) {
    return {
      ok: false,
      error: {
        kind: `cover_${coverProcessed.error.kind}`,
        message: coverProcessed.error.message,
      },
    };
  }
  const coverData = coverProcessed.data;

  const coverHash = hashImageBytes(coverData.webpBuffer);
  const coverPath = `${userId}/${coverHash}.webp`;

  const { error: coverUploadErr } = await supabase.storage
    .from(BUCKET)
    .upload(coverPath, coverData.webpBuffer, {
      contentType: 'image/webp',
      cacheControl: '31536000',
      upsert: true,
    });

  if (coverUploadErr) {
    return {
      ok: false,
      error: {
        kind: 'cover_upload_failed',
        message: coverUploadErr.message,
      },
    };
  }

  const { data: coverPublicUrl } = supabase.storage.from(BUCKET).getPublicUrl(coverPath);

  const spineRender = renderSpine({
    title: entry.title,
    author: entry.author,
    language: entry.language,
    coverBaseColor: coverData.dominantColor,
  });
  if (!spineRender.ok) {
    return {
      ok: false,
      error: {
        kind: `spine_render_${spineRender.error.kind}`,
        message: spineRender.error.message,
      },
    };
  }

  const spineProcessed = await processImage(spineRender.png);
  if (!spineProcessed.ok) {
    return {
      ok: false,
      error: {
        kind: `spine_${spineProcessed.error.kind}`,
        message: spineProcessed.error.message,
      },
    };
  }
  const spineData = spineProcessed.data;

  const spineHash = hashImageBytes(spineData.webpBuffer);
  const spinePath = `${userId}/${spineHash}.webp`;

  const { error: spineUploadErr } = await supabase.storage
    .from(BUCKET)
    .upload(spinePath, spineData.webpBuffer, {
      contentType: 'image/webp',
      cacheControl: '31536000',
      upsert: true,
    });

  if (spineUploadErr) {
    return {
      ok: false,
      error: {
        kind: 'spine_upload_failed',
        message: spineUploadErr.message,
      },
    };
  }

  const { data: spinePublicUrl } = supabase.storage.from(BUCKET).getPublicUrl(spinePath);

  let insertedBook;
  try {
    insertedBook = await booksRepo.create({
      userId,
      shelfId,
      title: entry.title,
      author: entry.author,
      language: entry.language,
      isbn: entry.isbn ?? null,
      publisher: entry.publisher ?? null,
      publishedYear: entry.publishedYear ?? null,
      source: 'manual',
      coverSource: 'user_upload',
      coverImageUrl: coverPublicUrl.publicUrl,
      coverStoragePath: coverPath,
      coverDominantColor: coverData.dominantColor,
      spineImageUrl: spinePublicUrl.publicUrl,
      spineStoragePath: spinePath,
      shelfOrder,
    });
  } catch (err) {
    return {
      ok: false,
      error: {
        kind: 'books_insert_failed',
        message: err instanceof Error ? err.message : 'insert failed',
      },
    };
  }

  return {
    ok: true,
    book: {
      index,
      bookId: insertedBook.id,
      title: entry.title,
      coverUrl: coverPublicUrl.publicUrl,
      spineUrl: spinePublicUrl.publicUrl,
    },
  };
}

function errorResponse(status: number, kind: string, message: string): NextResponse {
  return NextResponse.json({ ok: false, error: { kind, message } }, { status });
}