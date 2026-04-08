/**
 * PBR material presets for book objects.
 * Values sourced from PROJECT_KNOWLEDGE.md §13.3.
 *
 * Why factory objects rather than instantiated materials:
 * R3F prefers declarative props on <meshStandardMaterial /> so the
 * renderer can reconcile material changes without manual dispose().
 */

import type { ColorRepresentation } from 'three';

export type MaterialPresetName = 'hardcover' | 'paperback' | 'leather' | 'glass';

export interface MaterialPresetProps {
  color: ColorRepresentation;
  roughness: number;
  metalness: number;
  transparent?: boolean;
  opacity?: number;
}

export const MATERIAL_PRESETS: Record<MaterialPresetName, MaterialPresetProps> = {
  hardcover: {
    color: '#F5F0E8',
    roughness: 0.6,
    metalness: 0.0,
  },
  paperback: {
    color: '#E8E0D0',
    roughness: 0.9,
    metalness: 0.0,
  },
  leather: {
    color: '#4A2810',
    roughness: 0.7,
    metalness: 0.0,
  },
  glass: {
    color: '#FFFFFF',
    roughness: 0.1,
    metalness: 0.9,
    transparent: true,
    opacity: 0.3,
  },
} as const;

/**
 * Page block material — always the same warm aged-paper look,
 * independent of cover preset.
 */
export const PAGE_BLOCK_MATERIAL: MaterialPresetProps = {
  color: '#E8DCC4',
  roughness: 0.95,
  metalness: 0.0,
};