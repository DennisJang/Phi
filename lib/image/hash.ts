import { createHash } from 'node:crypto';

/**
 * Generates a deterministic cache key from a remote image URL.
 *
 * Same URL -> same key, always. Enables Storage-level deduplication:
 * if two books share the same Aladin cover URL, we fetch and process
 * the image exactly once.
 *
 * Uses SHA-1 (40 hex chars) rather than SHA-256 (64) because:
 *   - This is a cache key, not a cryptographic commitment
 *   - Collision resistance against adversarial inputs is not a
 *     requirement (the URL space we deal with is curated: Aladin,
 *     Google Books)
 *   - Shorter keys keep Storage paths readable in the dashboard
 *
 * The returned key does NOT include an extension. Callers append
 * '.webp' since all processed covers are normalized to WebP.
 */
export function hashImageUrl(url: string): string {
  return createHash('sha1').update(url, 'utf8').digest('hex');
}

/**
 * Generates a deterministic cache key from raw image bytes.
 *
 * Used by /api/cover-upload to address user-uploaded files by
 * content rather than URL (since uploads have no source URL).
 *
 * Same bytes -> same key -> same storage path -> upsert is
 * idempotent. Different bytes -> different key -> no collision.
 *
 * Same SHA-1 rationale as hashImageUrl: this is a cache key, not a
 * cryptographic commitment. The threat model is "user uploads the
 * same file twice", not "adversary crafts collisions".
 */
export function hashImageBytes(bytes: Buffer): string {
  return createHash('sha1').update(bytes).digest('hex');
}