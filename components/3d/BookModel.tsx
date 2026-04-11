'use client';

/**
 * BookModel — procedural book geometry.
 *
 * Dimensions (BASE_SCALE = 1.4):
 *   width     1.400   (BASE_SCALE)
 *   height    2.265   (BASE_SCALE × φ)         — §6.1, φ-derived
 *   thickness 0.350   (BASE_SCALE × 0.25)      — visual calibration, NOT φ
 *
 * NOTE: thickness is intentionally decoupled from φ but still scales
 * with BASE_SCALE. The §6.1 formula (thickness = width × 1/φ² ≈ 0.535)
 * makes the book read as a brick under the §9 spine-on camera (15° yaw)
 * — the spine stops being the dominant silhouette. 0.25 × BASE_SCALE
 * keeps the spine dominant while still feeling like a real book, and
 * stays proportional if BASE_SCALE is ever adjusted for scene framing.
 * height:width = φ:1 is preserved. Re-evaluate against a full shelf
 * in Phase 2.
 *
 * Geometry layout (origin at spine hinge, +X = book extends away from spine):
 *
 *        +Y (height)
 *         |
 *         |  [front cover]
 *         |  [page block ]
 *         |  [back cover ]──── +X (width)
 *        /
 *       +Z (thickness of closed book)
 *
 * All meshes are positioned so the spine sits on the X=0 plane,
 * which gives us a clean hinge axis for future features.
 */
import { useMemo } from 'react';
import * as THREE from 'three';
import { PHI } from '@/lib/phi/ratios';
import {
  MATERIAL_PRESETS,
  PAGE_BLOCK_MATERIAL,
  type MaterialPresetName,
} from '@/lib/three/materials';
import { useCoverTexture } from '@/lib/three/useCoverTexture';

// Base scale — chosen to preserve previous scene framing.
const BASE_SCALE = 1.4;


// φ-derived dimensions (§6.1)
const BOOK_WIDTH = BASE_SCALE;                 // 1.400
const BOOK_HEIGHT = BASE_SCALE * PHI;          // 2.265
const BOOK_THICKNESS = BASE_SCALE * 0.25; //0.140

// Construction constants (not φ-derived; physical book detail)
const COVER_THICKNESS = 0.02;
const PAGE_INSET = 0.03; // pages recessed slightly from cover edge

function useBoxGeometry(width: number, height: number, depth: number) {
  return useMemo(
    () => new THREE.BoxGeometry(width, height, depth),
    [width, height, depth]
  );
}

export interface BookModelProps {
  /** Material preset for the cover. Page block is always paper-toned. */
  preset?: MaterialPresetName;
  /** Optional cover art URL. When provided, UV-mapped onto the front cover only. */
  coverImageUrl?: string;
  /** Position of the book group in world space. */
  position?: [number, number, number];
  /** Rotation (euler) of the book group in world space. */
  rotation?: [number, number, number];
}

export function BookModel({
  preset = 'hardcover',
  coverImageUrl,
  position = [0, 0, 0],
  rotation = [0, 0, 0],
}: BookModelProps) {
  const coverMat = MATERIAL_PRESETS[preset];
  const { texture: coverTexture } = useCoverTexture(coverImageUrl);

  // Geometries — memoized so React reuses them across renders
  const frontCoverGeo = useBoxGeometry(BOOK_WIDTH, BOOK_HEIGHT, COVER_THICKNESS);
  const backCoverGeo = useBoxGeometry(BOOK_WIDTH, BOOK_HEIGHT, COVER_THICKNESS);
  const spineGeo = useBoxGeometry(
    COVER_THICKNESS,
    BOOK_HEIGHT,
    BOOK_THICKNESS
  );
  const pageBlockGeo = useBoxGeometry(
    BOOK_WIDTH - PAGE_INSET * 2,
    BOOK_HEIGHT - PAGE_INSET * 2,
    BOOK_THICKNESS - COVER_THICKNESS * 2
  );

  // Half-width offset so the spine sits on X=0 (hinge axis)
  const halfW = BOOK_WIDTH / 2;
  const halfT = BOOK_THICKNESS / 2;

  return (
    <group position={position} rotation={rotation}>
      {/* Front cover — top face of closed book.
      When a cover image is loaded, color must be white so the texture
      isn't tinted by the preset's base color. */}
      <mesh
        geometry={frontCoverGeo}
        position={[halfW, 0, halfT - COVER_THICKNESS / 2]}
        castShadow
        receiveShadow
      >
        <meshStandardMaterial
          roughness={coverMat.roughness}
          metalness={coverMat.metalness}
          color={coverTexture ? '#ffffff' : coverMat.color}
          map={coverTexture ?? undefined}
        />
      </mesh>

      {/* Back cover — bottom face */}
      <mesh
        geometry={backCoverGeo}
        position={[halfW, 0, -halfT + COVER_THICKNESS / 2]}
        castShadow
        receiveShadow
      >
        <meshStandardMaterial {...coverMat} />
      </mesh>

      {/* Spine — left edge, running full height, full thickness */}
      <mesh
        geometry={spineGeo}
        position={[COVER_THICKNESS / 2, 0, 0]}
        castShadow
        receiveShadow
      >
        <meshStandardMaterial {...coverMat} />
      </mesh>

      {/* Page block — sandwiched between covers */}
      <mesh
        geometry={pageBlockGeo}
        position={[halfW, 0, 0]}
        receiveShadow
      >
        <meshStandardMaterial {...PAGE_BLOCK_MATERIAL} />
      </mesh>
    </group>
  );
}

/** Export book dimensions so other components can lay books out on a shelf. */
export const BOOK_DIMENSIONS = {
  width: BOOK_WIDTH,
  height: BOOK_HEIGHT,
  thickness: BOOK_THICKNESS,
} as const;