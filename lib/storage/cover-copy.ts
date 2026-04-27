/**
 * BS-33 cover sha1 reference count helper.
 *
 * Cover binaries are content-addressed: the storage object at
 * `covers/{userId}/{sha1}.webp` is referenced by zero or more rows in
 * the `books` table via `books.cover_sha1`. Two independent users
 * adding the same Aladin book share the bytes (each user has its own
 * upload under their userId namespace, but the sha1 across users
 * coincides — useful for dedup analytics).
 *
 * This helper answers "is this cover still in use?" — read-only.
 * The actual Storage delete on count → 0 is owned by the GC worker
 * (PR5 spec / Phase 2 cron) so the cleanup decision stays in one
 * place.
 *
 * Soft-deleted books are excluded; the 30-day grace window owned by
 * the RemoveBook intent is treated as "still referencing" so we do
 * not orphan an undo path.
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database';

export const COVER_BUCKET = 'covers' as const;

export interface CoverRefCount {
  sha1: string;
  /** Live (non-soft-deleted) book rows referencing this sha1. */
  count: number;
  /** Distinct owners referencing this sha1. */
  ownerCount: number;
}

/** `covers/{userId}/{sha1}.webp` — the canonical Storage path. */
export function coverStoragePath(userId: string, sha1: string): string {
  return `${userId}/${sha1}.webp`;
}

/**
 * Count live book references to a cover sha1. Returns zero counts
 * when nothing references the sha1 — callers (GC) treat that as
 * "safe to delete the Storage object".
 */
export async function countCoverReferences(
  sha1: string,
  supabase: SupabaseClient<Database>,
): Promise<CoverRefCount> {
  const { data, error } = await supabase
    .from('books')
    .select('user_id')
    .eq('cover_sha1', sha1)
    .is('deleted_at', null);

  if (error) {
    throw new Error(`[cover-copy.countCoverReferences] ${error.message}`);
  }

  const rows = data ?? [];
  const owners = new Set<string>();
  for (const row of rows) {
    owners.add(row.user_id);
  }

  return {
    sha1,
    count: rows.length,
    ownerCount: owners.size,
  };
}
