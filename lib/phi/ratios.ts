/**
 * Phi System — Golden Ratio Constants
 *
 * Single source of truth for all ratio-derived values in Project Phi.
 * Any ratio appearing elsewhere in the codebase must be derived from these constants.
 *
 * See PROJECT_KNOWLEDGE.md §17.
 */

export const PHI = 1.6180339887 as const;
export const PHI_INV = 0.6180339887 as const;        // 1/φ
export const PHI_INV_SQ = 0.3819660113 as const;     // 1/φ²
export const PHI_INV_CUBE = 0.2360679775 as const;   // 1/φ³

/**
 * Book geometry ratios (Object layer).
 * Height : Width = φ : 1
 * Thickness = Width × (1/φ²)
 */
export const BOOK_RATIO = {
  HEIGHT_TO_WIDTH: PHI,
  THICKNESS_TO_WIDTH: PHI_INV_SQ,
  COVER_SAFE_AREA_INSET: PHI_INV_CUBE, // each side
} as const;

/**
 * Layout split ratios (Layout layer).
 * Detail page: 3D book (38.2%) | text content (61.8%)
 * Shelf view: each visible book occupies 1/φ² of screen width
 */
export const LAYOUT_RATIO = {
  DETAIL_BOOK_WIDTH: PHI_INV_SQ,    // 0.382
  DETAIL_TEXT_WIDTH: PHI_INV,       // 0.618
  SHELF_BOOK_WIDTH: PHI_INV_SQ,     // ~2.6 books visible
} as const;

/**
 * Animation duration ratios (Interaction layer).
 * Base: 1000ms. Fast = 1000 × 1/φ² ≈ 382ms. Default = 1000 × 1/φ ≈ 618ms.
 */
export const DURATION_MS = {
  FAST: 382,
  DEFAULT: 618,
  SLOW: 1000,
} as const;

/**
 * Golden ease-in-out. Used in all non-linear animations.
 * cubic-bezier(1/φ² − 0.0001, 0, 1/φ, 1)
 */
export const PHI_EASING = 'cubic-bezier(0.382, 0, 0.618, 1)' as const;

/**
 * Shelf view camera yaw angle.
 *
 * Horizontal offset of the camera from straight-on spine view. At 0° the
 * camera looks at the spine face dead-on (title reads flat); at this
 * value the camera is rotated around the book's vertical axis so that
 * the spine remains dominant but the front cover edge is visible as a
 * sliver — the Stripe Press 3/4 silhouette.
 *
 * Pitch is intentionally 0: the camera stays level, so the book's top
 * and bottom faces are never visible. Only yaw introduces perspective.
 *
 * 15° chosen by visual calibration, not φ-derived.
 */
export const SHELF_YAW_RAD = (15 * Math.PI) / 180; // 0.2618 rad