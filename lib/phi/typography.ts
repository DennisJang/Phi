/**
 * Phi System — Typography Scale
 *
 * Modular scale with ratio = φ. Base size 16px.
 * Five typography roles: display, title, heading, body, caption.
 *
 * See PROJECT_KNOWLEDGE.md §17.2 "Typography layer".
 */

import { PHI, PHI_INV } from './ratios';

const BASE_SIZE_PX = 16;

/**
 * Five canonical font sizes. No value outside this set may appear in user content.
 */
export const FONT_SIZE_PX = {
  caption: Math.round(BASE_SIZE_PX * PHI_INV),        // 10
  body: BASE_SIZE_PX,                                  // 16
  heading: Math.round(BASE_SIZE_PX * PHI),             // 26
  title: Math.round(BASE_SIZE_PX * PHI * PHI),         // 42
  display: Math.round(BASE_SIZE_PX * PHI * PHI * PHI), // 68
} as const;

export type FontRole = keyof typeof FONT_SIZE_PX;

/**
 * Line height formula: font-size × φ/2 ≈ font-size × 0.809
 * Applied to each role uniformly.
 */
export const LINE_HEIGHT = {
  caption: FONT_SIZE_PX.caption * (PHI / 2),
  body: FONT_SIZE_PX.body * (PHI / 2),
  heading: FONT_SIZE_PX.heading * (PHI / 2),
  title: FONT_SIZE_PX.title * (PHI / 2),
  display: FONT_SIZE_PX.display * (PHI / 2),
} as const;

/**
 * Two typefaces only. Never mix more than 2 per screen.
 * Serif for literary content. Sans for UI chrome.
 * Actual font files resolved at Step 5 (spine typography).
 */
export const FONT_FAMILY = {
  serif: '"Cormorant Garamond", Georgia, serif',
  sans: 'Pretendard, -apple-system, system-ui, sans-serif',
} as const;

export type FontFamily = keyof typeof FONT_FAMILY;

/**
 * Role → family mapping. Editor must use these, not arbitrary combinations.
 */
export const ROLE_FAMILY: Record<FontRole, FontFamily> = {
  display: 'serif',
  title: 'serif',
  heading: 'serif',
  body: 'serif',
  caption: 'sans',
} as const;