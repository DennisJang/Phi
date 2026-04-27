import type { ShelfAffinity } from '@/types/shelfAffinity';

/**
 * ShelfAffinityRepository — domain interface for the
 * `shelf_affinities` table.
 *
 * One affinity edge per (visitor_user_id, owner_user_id). Visits
 * upsert the row; the helper does NOT insert a fresh row each visit.
 */
export interface UpsertShelfAffinityInput {
  visitorUserId: string;
  ownerUserId: string;
  visitorCountry?: string | null;
}

export interface ShelfAffinityRepository {
  upsert(input: UpsertShelfAffinityInput): Promise<ShelfAffinity>;
}
