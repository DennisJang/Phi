import type { CardExport } from '@/types/cardExport';

/**
 * CardExportRepository — domain interface for the `card_exports`
 * table.
 *
 * PR2 declares only the shape; the Supabase adapter and wiring land
 * in PR3 alongside the CreateCard / DeleteCard intent flows.
 */
export interface CardExportRepository {
  findById(id: string): Promise<CardExport | null>;
  findByOwner(ownerId: string): Promise<CardExport[]>;
}
