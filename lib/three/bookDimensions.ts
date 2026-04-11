/**
 * Book dimensions — single source of truth.
 *
 * Extracted from BookModel.tsx so CoverMaterial can read faceAspect
 * without creating a circular import between the two 3D components.
 *
 * See BookModel.tsx header for the rationale behind each value
 * (why height is φ-derived but thickness is not).
 */
import { PHI } from '@/lib/phi/ratios';

const BASE_SCALE = 1.4;

export const BOOK_DIMENSIONS = {
  width: BASE_SCALE,              // 1.400
  height: BASE_SCALE * PHI,       // 2.265  — §6.1, φ-derived
  thickness: BASE_SCALE * 0.25,   // 0.350  — visual calibration, NOT φ
} as const;