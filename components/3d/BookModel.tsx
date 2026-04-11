'use client';

/**
 * BookModel — procedural book geometry.
 *
 * Dimensions live in lib/three/bookDimensions.ts (extracted to avoid
 * a circular import with CoverMaterial).
 *
 * Front cover uses CoverMaterial (shader, letterbox) when a URL is
 * provided; otherwise falls back to the preset's meshStandardMaterial.
 * Back cover and spine always use meshStandardMaterial to preserve
 * PBR lighting response — only the front face is shader-lit.
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
 */
import { useEffect, useMemo, useState } from 'react';
import * as THREE from 'three';
import { BOOK_DIMENSIONS } from '@/lib/three/bookDimensions';
import {
  MATERIAL_PRESETS,
  PAGE_BLOCK_MATERIAL,
  type MaterialPresetName,
} from '@/lib/three/materials';
import { loadCoverFromUrl, type CoverPipelineResult } from '@/lib/three/coverPipeline';
import { CoverMaterial } from './CoverMaterial';

const { width: BOOK_WIDTH, height: BOOK_HEIGHT, thickness: BOOK_THICKNESS } = BOOK_DIMENSIONS;
const COVER_THICKNESS = 0.02;
const PAGE_INSET = 0.03;

function useBoxGeometry(width: number, height: number, depth: number) {
  return useMemo(
    () => new THREE.BoxGeometry(width, height, depth),
    [width, height, depth]
  );
}

/**
 * Load a cover URL through the pipeline.
 * Race-condition safe: if the URL changes mid-flight, the stale
 * result is discarded and the stale texture is disposed.
 */
function useCoverPipeline(url: string | undefined): CoverPipelineResult | null {
  const [result, setResult] = useState<CoverPipelineResult | null>(null);

  useEffect(() => {
    if (!url) {
      setResult(null);
      return;
    }
    let cancelled = false;
    let loaded: CoverPipelineResult | null = null;

    loadCoverFromUrl(url)
      .then((r) => {
        if (cancelled) {
          r.texture.dispose();
          return;
        }
        loaded = r;
        setResult(r);
      })
      .catch((err) => {
        if (!cancelled) {
          console.error('[BookModel] cover load failed:', err);
          setResult(null);
        }
      });

    return () => {
      cancelled = true;
      if (loaded) loaded.texture.dispose();
    };
  }, [url]);

  return result;
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
  const coverMat = MATERIAL_PRESETS[preset];
  const cover = useCoverPipeline(coverImageUrl);

  const frontCoverGeo = useBoxGeometry(BOOK_WIDTH, BOOK_HEIGHT, COVER_THICKNESS);
  const backCoverGeo = useBoxGeometry(BOOK_WIDTH, BOOK_HEIGHT, COVER_THICKNESS);
  const spineGeo = useBoxGeometry(COVER_THICKNESS, BOOK_HEIGHT, BOOK_THICKNESS);
  const pageBlockGeo = useBoxGeometry(
    BOOK_WIDTH - PAGE_INSET * 2,
    BOOK_HEIGHT - PAGE_INSET * 2,
    BOOK_THICKNESS - COVER_THICKNESS * 2
  );

  const halfW = BOOK_WIDTH / 2;
  const halfT = BOOK_THICKNESS / 2;

  return (
    <group position={position} rotation={rotation}>
      {/* Front cover — CoverMaterial (shader) when cover loaded, preset fallback otherwise */}
      <mesh
        geometry={frontCoverGeo}
        position={[halfW, 0, halfT - COVER_THICKNESS / 2]}
        castShadow
        receiveShadow
      >
        {cover ? (
          <CoverMaterial
            texture={cover.texture}
            dominantColor={cover.dominantColor}
            coverAspect={cover.coverAspect}
          />
        ) : (
          <meshStandardMaterial {...coverMat} />
        )}
      </mesh>

      <mesh
        geometry={backCoverGeo}
        position={[halfW, 0, -halfT + COVER_THICKNESS / 2]}
        castShadow
        receiveShadow
      >
        <meshStandardMaterial {...coverMat} />
      </mesh>

      <mesh
        geometry={spineGeo}
        position={[COVER_THICKNESS / 2, 0, 0]}
        castShadow
        receiveShadow
      >
        <meshStandardMaterial {...coverMat} />
      </mesh>

      <mesh geometry={pageBlockGeo} position={[halfW, 0, 0]} receiveShadow>
        <meshStandardMaterial {...PAGE_BLOCK_MATERIAL} />
      </mesh>
    </group>
  );
}

/** Re-export for API stability — callers already import this from BookModel. */
export { BOOK_DIMENSIONS };