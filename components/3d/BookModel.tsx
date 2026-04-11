'use client';

/**
 * BookModel — procedural book geometry with unified cover material.
 *
 * All three outward faces (front / spine / back) use the SAME
 * CoverMaterial class, differing only in `face` prop and uniforms.
 * This is what delivers visual continuity: identical PBR response,
 * identical roughness, edge-matched color on front + spineColor on
 * the sides. See CoverMaterial.tsx header and Decisions Log 2026-04-11.
 *
 * When no cover URL is provided, all three faces fall back to the
 * preset's plain meshStandardMaterial, preserving Step 3 behavior.
 *
 * Geometry layout (origin at spine hinge, +X = book extends away):
 *
 *        +Y (height)
 *         |
 *         |  [front cover]
 *         |  [page block ]
 *         |  [back cover ]──── +X (width)
 *        /
 *       +Z (thickness of closed book)
 */
import { useEffect, useMemo, useState } from 'react';
import * as THREE from 'three';
import { BOOK_DIMENSIONS } from '@/lib/three/bookDimensions';
import {
  MATERIAL_PRESETS,
  PAGE_BLOCK_MATERIAL,
  type MaterialPresetName,
} from '@/lib/three/materials';
import { loadCoverFromUrl, type CoverSample } from '@/lib/three/coverPipeline';
import { CoverMaterial } from './CoverMaterial';

const { width: BOOK_WIDTH, height: BOOK_HEIGHT, thickness: BOOK_THICKNESS } = BOOK_DIMENSIONS;
const COVER_THICKNESS = 0.02;
const PAGE_INSET = 0.03;
// Cover slab X-width: full book width minus the spine's X footprint.
// Leaves room for the page block to protrude at the fore-edge.
const COVER_SLAB_WIDTH = BOOK_WIDTH - COVER_THICKNESS;
const COVER_SLAB_X = COVER_THICKNESS + COVER_SLAB_WIDTH / 2;
function useBoxGeometry(w: number, h: number, d: number) {
  return useMemo(() => new THREE.BoxGeometry(w, h, d), [w, h, d]);
}

/**
 * Race-safe cover loader.
 *
 * Previous version disposed `loaded` in cleanup, which could dispose
 * a texture that was still rendering (the one currently held in
 * `result` state). Fix: only cancel in-flight loads in cleanup, and
 * dispose the OLD successful texture at the moment the NEW one
 * replaces it in state. The final texture is disposed on unmount.
 */
function useCoverSample(url: string | undefined): CoverSample | null {
  const [sample, setSample] = useState<CoverSample | null>(null);

  useEffect(() => {
    if (!url) {
      setSample(null);
      return;
    }
    let cancelled = false;
    loadCoverFromUrl(url)
      .then((next) => {
        if (cancelled) {
          next.texture.dispose();
          return;
        }
        setSample((prev) => {
          if (prev) prev.texture.dispose();
          return next;
        });
      })
      .catch((err) => {
        if (!cancelled) {
          console.error('[BookModel] cover load failed:', err);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [url]);

  useEffect(() => {
    return () => {
      setSample((prev) => {
        if (prev) prev.texture.dispose();
        return null;
      });
    };
  }, []);

  return sample;
}

export interface BookModelProps {
  preset?: MaterialPresetName;
  coverImageUrl?: string;
  position?: [number, number, number];
  rotation?: [number, number, number];
}

export function BookModel({
  preset = 'hardcover',
  coverImageUrl,
  position = [0, 0, 0],
  rotation = [0, 0, 0],
}: BookModelProps) {
  const presetProps = MATERIAL_PRESETS[preset];
  const cover = useCoverSample(coverImageUrl);

  const frontGeo = useBoxGeometry(COVER_SLAB_WIDTH, BOOK_HEIGHT, COVER_THICKNESS);
  const backGeo = useBoxGeometry(COVER_SLAB_WIDTH, BOOK_HEIGHT, COVER_THICKNESS);
  const spineGeo = useBoxGeometry(COVER_THICKNESS, BOOK_HEIGHT, BOOK_THICKNESS);
  const pageGeo = useBoxGeometry(
    COVER_SLAB_WIDTH - PAGE_INSET,          // +X fore-edge inset (spine side flush)
    BOOK_HEIGHT - PAGE_INSET * 2,
    BOOK_THICKNESS - COVER_THICKNESS * 2
  );

  const halfT = BOOK_THICKNESS / 2;
  const pageX = COVER_SLAB_X - PAGE_INSET / 2;

  return (
    <group position={position} rotation={rotation}>
      {/* Front cover */}
      <mesh
        geometry={frontGeo}
        position={[COVER_SLAB_X, 0, halfT - COVER_THICKNESS / 2]}
        castShadow
        receiveShadow
      >
        {cover ? (
          <CoverMaterial
            face="front"
            preset={presetProps}
            texture={cover.texture}
            coverAspect={cover.aspect}
            colorTop={cover.colorTop}
            colorBottom={cover.colorBottom}
          />
        ) : (
          <meshStandardMaterial {...presetProps} />
        )}
      </mesh>

      {/* Back cover — solid spineColor when cover loaded */}
      <mesh
        geometry={backGeo}
        position={[COVER_SLAB_X, 0, -halfT + COVER_THICKNESS / 2]}
        castShadow
        receiveShadow
      >
        {cover ? (
          <CoverMaterial
            face="back"
            preset={presetProps}
            colorTop={cover.spineColor}
            colorBottom={cover.spineColor}
          />
        ) : (
          <meshStandardMaterial {...presetProps} />
        )}
      </mesh>

      {/* Spine — solid spineColor when cover loaded */}
      <mesh
        geometry={spineGeo}
        position={[COVER_THICKNESS / 2, 0, 0]}
        castShadow
        receiveShadow
      >
        {cover ? (
          <CoverMaterial
            face="spine"
            preset={presetProps}
            colorTop={cover.spineColor}
            colorBottom={cover.spineColor}
          />
        ) : (
          <meshStandardMaterial {...presetProps} />
        )}
      </mesh>

      {/* Page block — always plain PBR */}
      <mesh geometry={pageGeo} position={[pageX, 0, 0]} receiveShadow>
        <meshStandardMaterial {...PAGE_BLOCK_MATERIAL} />
      </mesh>
    </group>
  );
}

/** Re-export for API stability — callers already import this from BookModel. */
export { BOOK_DIMENSIONS };