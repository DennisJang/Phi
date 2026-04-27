/**
 * CardExport — domain type for the `card_exports` table.
 *
 * Spotify Wrapped-style snapshot of a user's shelf. `id` is a nanoid
 * (text), not a UUID, so it can sit in a short shareable URL.
 *
 * `selected_book_ids` is the ordered list of book ids included in
 * the snapshot at capture time. `snapshot_data` holds the rendered
 * payload (titles/authors/cover_sha1s) so the card stays valid even
 * after the source books are edited or removed.
 */

export type CardFormat = 'square' | 'story' | 'wide';

export interface CardExport {
  id: string;
  ownerId: string;
  intentId: string | null;

  format: CardFormat;
  selectedBookIds: string[];
  snapshotData: Record<string, unknown>;
  backdropCountry: string | null;

  imagePath: string | null;
  imageSha1: string | null;

  createdAt: string;
  deletedAt: string | null;
}
