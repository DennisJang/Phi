/**
 * Phi System — Constraint Manifest
 *
 * The exhaustive enumeration of what Phi editors may produce.
 * If a value is not in this file, it cannot appear in user content.
 *
 * This file imports from every other lib/phi/ module and re-exports
 * the user-facing option sets as frozen arrays. The editor UI (Phase 3)
 * will render option pickers directly from these arrays.
 *
 * See PROJECT_KNOWLEDGE.md §18 "Constrained Creativity".
 */

import { BLOCK_TYPES, type BlockType } from './blocks';
import { USER_CONTENT_COLORS, type UserContentColor } from './colors';
import type { FontRole } from './typography';
import type { SpacingStep } from './spacing';

/**
 * Alignment options available in any block that supports alignment.
 */
export const ALIGNMENTS = ['left', 'center', 'right'] as const;

/**
 * Image aspect ratios available in image blocks.
 */
export const IMAGE_ASPECT_RATIOS = ['1:1', 'phi:1', '1:phi'] as const;

/**
 * Font roles a heading block may use. Paragraph always uses 'body'.
 */
export const HEADING_ROLES = ['heading', 'title', 'display'] as const satisfies readonly FontRole[];

/**
 * Spacing steps the editor exposes.
 */
export const SPACING_STEPS: readonly SpacingStep[] = [
  'tight',
  'regular',
  'loose',
] as const;

/**
 * The full constraint manifest — single object for the editor to read.
 */
export const PHI_CONSTRAINTS = {
  blockTypes: BLOCK_TYPES,
  colors: USER_CONTENT_COLORS,
  headingRoles: HEADING_ROLES,
  alignments: ALIGNMENTS,
  spacingSteps: SPACING_STEPS,
  imageAspectRatios: IMAGE_ASPECT_RATIOS,
} as const;

export type PhiConstraints = typeof PHI_CONSTRAINTS;

/**
 * Convenience re-exports for type-level consumers.
 */
export type { BlockType, UserContentColor, FontRole, SpacingStep };