import type { Book, CreateBookInput } from '@/types/book';

/**
 * BookRepository — domain interface for books table access.
 *
 * Kept intentionally small for Step 6.5. Extend in future Steps when
 * a concrete UI need arises (state transitions, is_featured toggle,
 * per-shelf listing, etc.) — not preemptively.
 *
 * `deleteAllByUser` is a soft delete: rows are marked with
 * `deleted_at = now()` and filtered out of `findByUser`. Hard
 * delete is deliberately not exposed; Storage GC + row purge are
 * scheduled for Phase 2.
 */
export interface BookRepository {
  findByUser(userId: string): Promise<Book[]>;
  create(input: CreateBookInput): Promise<Book>;
  deleteAllByUser(userId: string): Promise<void>;
}
