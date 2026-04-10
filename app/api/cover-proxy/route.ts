import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { fetchRemoteImage } from '@/lib/image/fetchRemoteImage';
import { processImage } from '@/lib/image/dominantColor';
import { hashImageUrl } from '@/lib/image/hash';

/**
 * GET /api/cover-proxy?url=<encoded-remote-url>
 *
 * Fetches a remote book-cover image, converts it to WebP, extracts
 * the dominant color, stores it in the `covers` Supabase bucket, and
 * returns a stable public URL + metadata.
 *
 * Design: pure transformer, no in-route cache layer.
 *
 *   This route is stateless from the caller's perspective. It always
 *   performs fetch + decode + color extraction + WebP encode + upload.
 *   The storage path is deterministic (SHA-1 of source URL), so
 *   repeated calls for the same source URL overwrite the same object
 *   via upsert and yield the same public URL.
 *
 *   Callers are responsible for persisting the returned url +
 *   dominantColor + width + height to their own `books` row so that
 *   future reads hit their DB and skip this route entirely.
 *
 * Why no in-route cache:
 *
 *   1. The supabase-js list() method does not return user-defined
 *      metadata — only system fields like eTag and size. So a cache
 *      hit could give us the file back but not the dominantColor
 *      that motivated the cache in the first place.
 *   2. Calling .info() per request to read user metadata is one extra
 *      round trip that saves only ~300ms of sharp+colorthief work.
 *      Not worth the complexity when the caller's DB is the real cache.
 *   3. Same-URL duplicate processing is rare (same book added twice
 *      across different users) and the cost is bounded.
 *
 * Response shape on success:
 *
 *   {
 *     ok: true,
 *     data: {
 *       url: string,              // public CDN URL
 *       dominantColor: string,    // "#RRGGBB"
 *       width: number,
 *       height: number
 *     }
 *   }
 *
 * Response shape on error:
 *
 *   { ok: false, error: { kind: string, message: string } }
 *
 * This route never writes to the `books` table. Separation of
 * concerns: the proxy is a pure image-processing service.
 */

// sharp is a native binary, incompatible with the Edge runtime.
export const runtime = 'nodejs';

// Never statically cache this route.
export const dynamic = 'force-dynamic';

const BUCKET = 'covers';

interface CoverProxyData {
  url: string;
  dominantColor: string;
  width: number;
  height: number;
}

export async function GET(request: Request): Promise<NextResponse> {
  const { searchParams } = new URL(request.url);
  const sourceUrl = searchParams.get('url');

  if (!sourceUrl) {
    return errorResponse(400, 'missing_url', 'Query parameter "url" is required');
  }

  const supabase = createAdminClient();
  const cacheKey = hashImageUrl(sourceUrl);
  const storagePath = `${cacheKey}.webp`;

  // ============================================================
  // Step 1: Fetch source image
  // ============================================================
  const fetchResult = await fetchRemoteImage(sourceUrl);
  if (!fetchResult.ok) {
    const status = mapFetchErrorToStatus(fetchResult.error.kind);
    return errorResponse(status, fetchResult.error.kind, fetchResult.error.message);
  }

  // ============================================================
  // Step 2: Decode, extract color, encode WebP
  // ============================================================
  const processResult = await processImage(fetchResult.buffer);
  if (!processResult.ok) {
    return errorResponse(
      422,
      processResult.error.kind,
      processResult.error.message
    );
  }
  const { webpBuffer, dominantColor, width, height } = processResult.data;

  // ============================================================
  // Step 3: Upload to Storage
  // ============================================================
  // upsert: true so repeated calls for the same source URL yield
  // the same public URL and overwrite cleanly if a prior call crashed.
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
  // Step 4: Return public URL + extracted data
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
    } satisfies CoverProxyData,
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

function mapFetchErrorToStatus(
  kind:
    | 'invalid_url'
    | 'invalid_scheme'
    | 'timeout'
    | 'upstream_status'
    | 'invalid_content_type'
    | 'too_large'
    | 'network'
): number {
  switch (kind) {
    case 'invalid_url':
    case 'invalid_scheme':
      return 400;
    case 'invalid_content_type':
      return 415;
    case 'too_large':
      return 413;
    case 'timeout':
      return 504;
    case 'upstream_status':
    case 'network':
      return 502;
    default:
      return 500;
  }
}