import { PHI } from '@/lib/phi/ratios';

const BASE_SCALE = 1.4;

export const BOOK_DIMENSIONS = {
  width: BASE_SCALE,
  height: BASE_SCALE * PHI,
  thickness: BASE_SCALE * 0.25,
} as const;

export const COVER_THICKNESS = 0.02;
export const PAGE_INSET = 0.015;   // 0.03 → 0.015 (절반)