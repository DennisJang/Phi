import { NextResponse } from 'next/server';
import { createClient as createServerClient } from '@/lib/supabase/server';
import { processImage } from '@/lib/image/processImage';
import { hashImageBytes } from '@/lib/image/hash';

/**
 * POST /api/cover-upload
 *
 * Accepts a user-uploaded image file via multipart/form-data,
 * processes it identically to /api/cover-proxy, and stores it
 * under the authenticated user's namespace in the `covers` bucket.
 *
 * This is the Step 4c counterpart to Step 4b's cover-proxy. The
 * two routes share the same processImage() pipeline and return
 * the same response shape, so downstream consumers (Step 4e
 * letterbox compositor, Step 6 Aladin integration, Step 7 manual
 * add) can treat all three cover sources as a single interface.
 *
 * Request:
 *
 *   Content-Type: multipart/form-data
 *   Body field: "file" (the image)
 *
 * Authentication:
 *
 *   Required. The caller must have a Supabase session cookie set,
 *   which Phase 1 obtains via anonymous sign-in (see
 *   AnonymousBootstrap). Phase 2 will replace this with real auth.
 *
 *   We use getUser() rather than getSession() because session-only
 *   reads only parse the cookie locally without verifying the JWT
 *   signature. getUser() round-trips to Supabase to verify the
 *   token, which is the only safe choice for an authorization
 *   decision in an API route.
 *
 * Storage:
 *
 *   Path is `{user_id}/{sha1(file bytes)}.webp`. Content-addressed
 *   so the same file uploaded twice yields the same path and is
 *   handled cleanly by upsert: true. Cross-user isolation is
 *   enforced by the `covers_user_insert_own_folder` RLS policy
 *   added in migration 20260410_140000.
 *
 *   We use the cookie-bound server client (not service_role) so
 *   the upload runs through RLS. If the user tried to write to
 *   another user's folder, the policy would reject it; we let RLS
 *   be the source of truth rather than re-implementing the check
 *   in application code.
 *
 * Validation strategy:
 *
 *   Two layers, with the deeper one being the real boundary.
 *
 *   1. Shallow (route entry): file presence, declared MIME in our
 *      allowlist, declared size <= 5MB. These catch honest mistakes
 *      cheaply but cannot be trusted against malicious clients.
 *
 *   2. Deep (sharp decode inside processImage): if the bytes are
 *      not actually a valid image, sharp.metadata() throws and the
 *      route returns 422. This is the only validation that matters
 *      for security. A client lying about Content-Type cannot
 *      smuggle non-image bytes past sharp.
 *
 *   We do not parse magic bytes manually because sharp does it
 *   inherently and more rigorously.
 *
 * Response shape on success: identical to /api/cover-proxy.
 *
 *   {
 *     ok: true,
 *     data: { url, dominantColor, width, height }
 *   }
 *
 * Response shape on error: identical to /api/cover-proxy.
 *
 *   { ok: false, error: { kind, message } }
 */

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const BUCKET = 'covers';
const MAX_BYTES = 5 * 1024 * 1024; // 5MB
const ALLOWED_MIME = new Set(['image/jpeg', 'image/png', 'image/webp']);

interface CoverUploadData {
  url: string;
  dominantColor: string;
  width: number;
  height: number;
}

export async function POST(request: Request): Promise<NextResponse> {
  // ============================================================
  // Step 1: Authenticate
  // ============================================================
  const supabase = await createServerClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return errorResponse(401, 'unauthenticated', 'Sign-in required');
  }

  // ============================================================
  // Step 2: Parse multipart body, locate file field
  // ============================================================
  let formData: FormData;
  try {
    formData = await request.formData();
  } catch (err) {
    return errorResponse(
      400,
      'invalid_form_data',
      err instanceof Error ? err.message : 'Failed to parse multipart body'
    );
  }

  const fileEntry = formData.get('file');
  if (!fileEntry || typeof fileEntry === 'string') {
    return errorResponse(
      400,
      'missing_file',
      'Form field "file" is required and must be a file upload'
    );
  }
  const file = fileEntry as File;

  // ============================================================
  // Step 3: Shallow validation (declared metadata)
  // ============================================================
  if (file.size === 0) {
    return errorResponse(400, 'empty_file', 'Uploaded file is empty');
  }
  if (file.size > MAX_BYTES) {
    return errorResponse(
      413,
      'too_large',
      `File size ${file.size} exceeds limit ${MAX_BYTES}`
    );
  }
  if (!ALLOWED_MIME.has(file.type)) {
    return errorResponse(
      415,
      'invalid_content_type',
      `Content-Type "${file.type}" is not in the allowed set`
    );
  }

  // ============================================================
  // Step 4: Read bytes
  // ============================================================
  let buffer: Buffer;
  try {
    const arrayBuffer = await file.arrayBuffer();
    buffer = Buffer.from(arrayBuffer);
  } catch (err) {
    return errorResponse(
      400,
      'read_failed',
      err instanceof Error ? err.message : 'Failed to read file bytes'
    );
  }

  // ============================================================
  // Step 5: Deep validation + transformation (sharp pipeline)
  // ============================================================
  // This is the real security boundary. If the bytes are not a
  // valid image, processImage returns decode_failed and we 422.
  const processResult = await processImage(buffer);
  if (!processResult.ok) {
    return errorResponse(422, processResult.error.kind, processResult.error.message);
  }
  const { webpBuffer, dominantColor, width, height } = processResult.data;

  // ============================================================
  // Step 6: Content-addressed storage path under user folder
  // ============================================================
  const contentHash = hashImageBytes(buffer);
  const storagePath = `${user.id}/${contentHash}.webp`;

  // ============================================================
  // Step 7: Upload (RLS-enforced via cookie-bound client)
  // ============================================================
  const { error: uploadError } = await supabase.storage
    .from(BUCKET)
    .upload(storagePath, webpBuffer, {
      contentType: 'image/webp',
      cacheControl: '31536000', // 1 year; content-addressed so safe
      upsert: true,
    });

  if (uploadError) {
    return errorResponse(
      500,
      'storage_upload_failed',
      `Storage upload failed: ${uploadError.message}`
    );
  }

  // ============================================================
  // Step 8: Return public URL + extracted data
  // ============================================================
  const { data: publicUrlData } = supabase.storage
    .from(BUCKET)
    .getPublicUrl(storagePath);

  return NextResponse.json({
    ok: true,
    data: {
      url: publicUrlData.publicUrl,
      dominantColor,
      width,
      height,
    } satisfies CoverUploadData,
  });
}

// ============================================================
// Helpers
// ============================================================

function errorResponse(
  status: number,
  kind: string,
  message: string
): NextResponse {
  return NextResponse.json(
    { ok: false, error: { kind, message } },
    { status }
  );
}