import type { Bookmark } from '@/types/bookmark';

/**
 * BookmarkRepository — domain interface for the `bookmarks` table.
 *
 * A bookmark is a visitor's signal on someone else's book. The
 * (visitor, book) pair must be unique; `create` uses INSERT ... ON
 * CONFLICT DO NOTHING semantics (idempotent at the data layer; the
 * Bookmark intent layer enforces idempotency at the intent layer).
 */
export interface CreateBookmarkInput {
  userId: string; // visitor
  bookId: string;
  visitorCountry?: string | null;
}

export interface BookmarkRepository {
  create(input: CreateBookmarkInput): Promise<Bookmark>;
  findByVisitorAndBook(userId: string, bookId: string): Promise<Bookmark | null>;
  delete(id: string): Promise<void>;
}
