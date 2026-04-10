/**
 * Phi System — Spacing Scale
 *
 * Three-step scale derived from φ. Base unit: 16px.
 * tight   = base × 1/φ²  ≈ 6px
 * regular = base × 1/φ   ≈ 10px
 * loose   = base × 1     = 16px
 *
 * Larger spacings are multiples of `loose` (loose × φ, loose × φ², etc.)
 * computed at call sites — not aliased here to keep the editor surface minimal.
 *
 * See PROJECT_KNOWLEDGE.md §17, §18.2.
 */

import { PHI_INV, PHI_INV_SQ } from './ratios';

const BASE_UNIT_PX = 16;

export const SPACING_PX = {
  tight: Math.round(BASE_UNIT_PX * PHI_INV_SQ),   // 6
  regular: Math.round(BASE_UNIT_PX * PHI_INV),    // 10
  loose: BASE_UNIT_PX,                             // 16
} as const;

export type SpacingStep = keyof typeof SPACING_PX;

/**
 * Block-gap presets. What an editor uses when placing blocks.
 * Editor exposes exactly these three choices — nothing else.
 */
export const BLOCK_GAP: Record<SpacingStep, number> = SPACING_PX;