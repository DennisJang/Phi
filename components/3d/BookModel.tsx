'use client';

/**
 * BookModel — procedural book geometry.
 *
 * Why procedural (not GLTF yet):
 * Phase 1 prioritizes iteration speed. Box geometry in code lets us
 * tweak proportions and test material presets instantly. GLTF swap
 * is a Phase 2 refactor (see PROJECT_KNOWLEDGE §6.1).
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
 * which gives us a clean hinge axis for the open animation later.
 */
import { useMemo } from 'react';
import * as THREE from 'three';
import {
  MATERIAL_PRESETS,
  PAGE_BLOCK_MATERIAL,
  type MaterialPresetName,
} from '@/lib/three/materials';
import { useCoverTexture } from '@/lib/three/useCoverTexture';

// Standard hardcover novel proportions (roughly 1.4 : 2.0 : 0.25 in world units)
const BOOK_WIDTH = 1.4;
const BOOK_HEIGHT = 2.0;
const BOOK_THICKNESS = 0.25;
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

  // ... rest unchanged until the front cover mesh
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