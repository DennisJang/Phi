/**
 * Shelf — domain type for the `shelves` table.
 *
 * Fields use camelCase; the Supabase adapter in
 * lib/supabase/repositories/shelfRepository.ts maps from the
 * snake_case DB row shape at the boundary.
 *
 * Invariants enforced at the DB level (see .claude/ARCHITECTURE.md
 * → shelves CHECK constraints):
 *   - exactly one default shelf of kind='library' per user
 *   - kind='wishlist' cannot have isDefault=true
 *   - visibility gates what /u/{username} and /s/{shareId} expose
 */

export type ShelfKind = 'library' | 'wishlist';

export type ShelfVisibility = 'private' | 'link' | 'public';

export interface Shelf {
  id: string;
  userId: string;

  name: string;
  kind: ShelfKind;
  visibility: ShelfVisibility;
  isDefault: boolean;

  createdAt: string;
  updatedAt: string;
}
