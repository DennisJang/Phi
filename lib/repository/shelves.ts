import type { Shelf } from '@/types/shelf';

/**
 * ShelfRepository — domain interface for shelves table access.
 *
 * `findDefaultLibraryByUser` returns the user's single default
 * library shelf, which is the insert-target for every add-book
 * path during Phase 1 (wishlist + multi-shelf arrive in Phase 2).
 * The DB guarantees exactly one such row per user via a unique
 * partial index; the interface returns `Shelf | null` so callers
 * can surface bootstrap races (profile without default shelf yet)
 * as a domain condition rather than a crash.
 */
export interface ShelfRepository {
  findDefaultLibraryByUser(userId: string): Promise<Shelf | null>;
  findAllByUser(userId: string): Promise<Shelf[]>;
}
