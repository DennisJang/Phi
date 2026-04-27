/**
 * ShelfAffinity — domain type for the `shelf_affinities` table.
 *
 * A row is created when a visitor enters another user's shelf scene
 * (EnterShelf intent). The pair (visitor_user_id, owner_user_id) is
 * what we treat as one affinity edge; multiple visits should upsert
 * the row and bump `updated_at`, not insert duplicates.
 */

export interface ShelfAffinity {
  id: string;
  visitorUserId: string;
  ownerUserId: string;
  visitorCountry: string | null;

  createdAt: string;
  updatedAt: string;
}
