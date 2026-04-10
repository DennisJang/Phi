/**
 * Safe remote image fetcher.
 *
 * Responsibilities (single-purpose):
 *   1. Validate URL scheme (http/https only)
 *   2. Fetch with timeout (10s)
 *   3. Validate Content-Type is image/*
 *   4. Validate Content-Length is <= MAX_BYTES (5 MB)
 *   5. Return a Node Buffer
 *
 * Known gap (tech debt, flagged for Step 6):
 *   SSRF is not defended against here. An attacker who supplied an
 *   arbitrary URL could probe internal network endpoints (e.g.
 *   169.254.169.254). In Phase 1 the URL source is internal
 *   (Aladin/Google Books API responses), so this is acceptable. When
 *   user-supplied URLs become a vector in later phases, add an
 *   allowlist of known image CDN domains before calling this.
 */

const FETCH_TIMEOUT_MS = 10_000;
const MAX_BYTES = 5 * 1024 * 1024; // 5 MB, matches Supabase bucket limit
const ALLOWED_MIME_PREFIX = 'image/';

export type FetchRemoteImageError =
  | { kind: 'invalid_url'; message: string }
  | { kind: 'invalid_scheme'; message: string }
  | { kind: 'timeout'; message: string }
  | { kind: 'upstream_status'; status: number; message: string }
  | { kind: 'invalid_content_type'; contentType: string | null; message: string }
  | { kind: 'too_large'; bytes: number; message: string }
  | { kind: 'network'; message: string };

export type FetchRemoteImageResult =
  | {
      ok: true;
      buffer: Buffer;
      contentType: string;
      byteLength: number;
    }
  | {
      ok: false;
      error: FetchRemoteImageError;
    };

export async function fetchRemoteImage(
  rawUrl: string
): Promise<FetchRemoteImageResult> {
  // 1. Parse URL
  let parsed: URL;
  try {
    parsed = new URL(rawUrl);
  } catch {
    return {
      ok: false,
      error: { kind: 'invalid_url', message: 'URL is not well-formed' },
    };
  }

  // 2. Scheme check
  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    return {
      ok: false,
      error: {
        kind: 'invalid_scheme',
        message: `Only http/https are allowed, got ${parsed.protocol}`,
      },
    };
  }

  // 3. Fetch with timeout
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  let response: Response;
  try {
    response = await fetch(rawUrl, {
      signal: controller.signal,
      // A generic UA. Aladin and Google Books accept this; if Wikimedia
      // or other strict-policy sources are added later, this may need
      // to be expanded with a contact URL per their User-Agent policy.
      headers: { 'User-Agent': 'Phi/1.0 (+cover-proxy)' },
      redirect: 'follow',
    });
  } catch (err) {
    clearTimeout(timeoutId);
    const isAbort = err instanceof Error && err.name === 'AbortError';
    return {
      ok: false,
      error: isAbort
        ? { kind: 'timeout', message: `Timed out after ${FETCH_TIMEOUT_MS}ms` }
        : {
            kind: 'network',
            message: err instanceof Error ? err.message : String(err),
          },
    };
  }
  clearTimeout(timeoutId);

  // 4. HTTP status check
  if (!response.ok) {
    return {
      ok: false,
      error: {
        kind: 'upstream_status',
        status: response.status,
        message: `Upstream returned ${response.status}`,
      },
    };
  }

  // 5. Content-Type check
  const contentType = response.headers.get('content-type');
  if (!contentType || !contentType.toLowerCase().startsWith(ALLOWED_MIME_PREFIX)) {
    return {
      ok: false,
      error: {
        kind: 'invalid_content_type',
        contentType,
        message: `Expected image/*, got ${contentType ?? '(none)'}`,
      },
    };
  }

  // 6. Content-Length preflight (if advertised)
  const contentLengthHeader = response.headers.get('content-length');
  if (contentLengthHeader) {
    const advertised = parseInt(contentLengthHeader, 10);
    if (Number.isFinite(advertised) && advertised > MAX_BYTES) {
      return {
        ok: false,
        error: {
          kind: 'too_large',
          bytes: advertised,
          message: `Image is ${advertised} bytes, max ${MAX_BYTES}`,
        },
      };
    }
  }

  // 7. Read body and enforce byte cap even if Content-Length was absent
  const arrayBuffer = await response.arrayBuffer();
  const byteLength = arrayBuffer.byteLength;
  if (byteLength > MAX_BYTES) {
    return {
      ok: false,
      error: {
        kind: 'too_large',
        bytes: byteLength,
        message: `Image is ${byteLength} bytes, max ${MAX_BYTES}`,
      },
    };
  }

  return {
    ok: true,
    buffer: Buffer.from(arrayBuffer),
    contentType,
    byteLength,
  };
}