/**
 * Phi System — Block Type Definitions
 *
 * Defines the 7 allowed block types that make up a book page's content.
 *
 * Phase 3 editor surface; no DB-backed table holds these blocks today
 * (the prior `book_pages` table was dropped during the Phi 2.0
 * Stage 1 refactor). When the editor lands, persistence will be
 * decided alongside the storage shape — this file documents the
 * frozen content schema in the meantime.
 *
 * See PROJECT_KNOWLEDGE.md §18.2 "Constraint boundaries".
 */

import type { FontRole } from './typography';
import type { UserContentColor } from './colors';
import type { SpacingStep } from './spacing';

/**
 * Alignment — 3 options only. No justify, no pixel offsets.
 */
export type BlockAlignment = 'left' | 'center' | 'right';

/**
 * Image aspect ratios — 3 options only, all φ-derived.
 */
export type ImageAspectRatio = '1:1' | 'phi:1' | '1:phi';

/**
 * Base fields every block shares.
 */
interface BlockBase {
  id: string;                    // client-generated nanoid
  gap: SpacingStep;              // space AFTER this block (before next one)
}

/**
 * Heading block — uses 'heading' | 'title' | 'display' roles only.
 * 'body' and 'caption' are reserved for Paragraph / Caption roles.
 */
export interface HeadingBlock extends BlockBase {
  type: 'heading';
  role: Extract<FontRole, 'heading' | 'title' | 'display'>;
  text: string;
  color: UserContentColor;
  align: BlockAlignment;
}

export interface ParagraphBlock extends BlockBase {
  type: 'paragraph';
  text: string;
  color: UserContentColor;
  align: BlockAlignment;
}

export interface QuoteBlock extends BlockBase {
  type: 'quote';
  text: string;
  attribution?: string;
  color: UserContentColor;
}

export interface ImageBlock extends BlockBase {
  type: 'image';
  storagePath: string;           // supabase storage path
  alt: string;
  aspectRatio: ImageAspectRatio;
  caption?: string;
}

export interface DividerBlock extends BlockBase {
  type: 'divider';
  color: UserContentColor;
}

export interface SpacerBlock extends BlockBase {
  type: 'spacer';
  step: SpacingStep;             // additional vertical breathing room
}

/**
 * Purchase widget — "내 서재로 들이기" (Bring to my shelf).
 * Rendered with affiliate links derived from ISBN (see PROJECT_KNOWLEDGE.md §5.3).
 * Has no user-editable fields beyond its placement.
 */
export interface PurchaseWidgetBlock extends BlockBase {
  type: 'purchase_widget';
}

/**
 * The 7 allowed blocks. This union is exhaustive and closed.
 */
export type Block =
  | HeadingBlock
  | ParagraphBlock
  | QuoteBlock
  | ImageBlock
  | DividerBlock
  | SpacerBlock
  | PurchaseWidgetBlock;

export type BlockType = Block['type'];

export const BLOCK_TYPES: readonly BlockType[] = [
  'heading',
  'paragraph',
  'quote',
  'image',
  'divider',
  'spacer',
  'purchase_widget',
] as const;

/**
 * The full document shape persisted at `book_pages.content`.
 *
 * `version` lets us migrate the schema safely if blocks ever change.
 * Bump only when the shape is not backward-compatible.
 */
export interface BookPageContent {
  version: 1;
  blocks: Block[];
}

/**
 * Empty document factory. Used when a new book is created.
 */
export const emptyBookPageContent = (): BookPageContent => ({
  version: 1,
  blocks: [],
});