/**
 * Phi System — Color Tokens
 *
 * Phase 1: Phi Dark palette only.
 * Phi Light palette is added in Phase 2.
 *
 * Editor may use these tokens only. No arbitrary color values allowed in user content.
 *
 * See PROJECT_KNOWLEDGE.md §3.5.
 */

export const PHI_DARK = {
  // Background
  bgCanvas: '#0A0A0A',
  bgSurface: '#141414',
  bgElevated: '#1A1A1A',
  bgOverlay: '#242424',

  // Text
  textPrimary: '#F5F0E8',
  textSecondary: '#A09888',
  textTertiary: '#6B6156',

  // Accent (warm)
  accentGold: '#D4A574',
  accentCream: '#F0E6D3',
  accentInk: '#2C1810',

  // Interactive (cool, reserved for action)
  interactivePrimary: '#7B9EBF',
  interactiveHover: '#9BB8D4',
} as const;

export type PhiDarkToken = keyof typeof PHI_DARK;

/**
 * Theme identifiers. Phase 1 ships with 'dark' only.
 * 'light' is wired in Phase 2 (see PROJECT_KNOWLEDGE.md §3.6).
 */
export type PhiTheme = 'dark' | 'light';

/**
 * User-content allowed color tokens (the constrained palette).
 * Only these 8 tokens may be referenced by user-created block content.
 * This is a strict subset of the full theme — chrome uses more, content uses less.
 */
export const USER_CONTENT_COLORS = [
  'textPrimary',
  'textSecondary',
  'textTertiary',
  'accentGold',
  'accentCream',
  'accentInk',
  'bgSurface',
  'bgElevated',
] as const satisfies readonly PhiDarkToken[];

export type UserContentColor = (typeof USER_CONTENT_COLORS)[number];