/**
 * Bookmark — domain type for the `bookmarks` table.
 *
 * A bookmark is a lightweight signal a *visitor* leaves on someone
 * else's book. `user_id` is the visitor; the owner is derived via
 * the `book_id` foreign key. The owner-side aggregate
 * (`books.bookmark_count`) is denormalized for read performance.
 */

export interface Bookmark {
  id: string;
  userId: string; // visitor
  bookId: string;
  visitorCountry: string | null; // ISO 3166-1 alpha-2

  createdAt: string;
  updatedAt: string;
}
