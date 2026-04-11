'use client';
import { useEffect, useMemo, useState } from 'react';
import * as THREE from 'three';
import {
  BOOK_DIMENSIONS, COVER_THICKNESS, PAGE_INSET,
} from '@/lib/three/bookDimensions';
import {
  MATERIAL_PRESETS, PAGE_BLOCK_MATERIAL, type MaterialPresetName,
} from '@/lib/three/materials';
import { loadCoverFromUrl, type CoverSample } from '@/lib/three/coverPipeline';
import { getPaperNormalTexture } from '@/lib/three/paperNormal';
import { CoverMaterial } from './CoverMaterial';

const { width: W, height: H, thickness: T } = BOOK_DIMENSIONS;

function useBox(w: number, h: number, d: number) {
  return useMemo(() => new THREE.BoxGeometry(w, h, d), [w, h, d]);
}

function useCoverSample(url: string | undefined): CoverSample | null {
  const [s, setS] = useState<CoverSample | null>(null);
  useEffect(() => {
    if (!url) { setS(null); return; }
    let cancelled = false;
    loadCoverFromUrl(url).then((next) => {
      if (cancelled) { next.texture.dispose(); return; }
      setS((prev) => { prev?.texture.dispose(); return next; });
    }).catch((e) => !cancelled && console.error('[BookModel]', e));
    return () => { cancelled = true; };
  }, [url]);
  useEffect(() => () => {
    setS((prev) => { prev?.texture.dispose(); return null; });
  }, []);
  return s;
}

export interface BookModelProps {
  preset?: MaterialPresetName;
  coverImageUrl?: string;
  position?: [number, number, number];
  rotation?: [number, number, number];
}

export function BookModel({
  preset = 'hardcover', coverImageUrl,
  position = [0, 0, 0], rotation = [0, 0, 0],
}: BookModelProps) {
  const presetProps = MATERIAL_PRESETS[preset];
  const cover = useCoverSample(coverImageUrl);
  const paperNormal = useMemo(() => getPaperNormalTexture(), []);

  // Cover slabs cover the full book W×H. Page block is inset on all
  // non-spine sides (top/bottom/fore-edge) by PAGE_INSET, and squeezed
  // in Z by COVER_THICKNESS on front+back.
  const frontGeo = useBox(W, H, COVER_THICKNESS);
  const backGeo = useBox(W, H, COVER_THICKNESS);
  const spineGeo = useBox(COVER_THICKNESS, H, T);
  const pageGeo = useBox(
    W - COVER_THICKNESS - PAGE_INSET,     // spine(0.02) + fore-edge(0.03) removed
    H - PAGE_INSET * 2,                    // top + bottom inset
    T - COVER_THICKNESS * 2
  );

  const halfT = T / 2;
  const coverZFront = halfT - COVER_THICKNESS / 2;
  const coverZBack = -halfT + COVER_THICKNESS / 2;
  // Cover slabs centered in X at W/2 (origin at spine hinge).
  const coverX = W / 2;
  // Page block: starts after spine thickness, ends PAGE_INSET before fore-edge.
  const pageX = COVER_THICKNESS + (W - COVER_THICKNESS - PAGE_INSET) / 2;
  const baseColor = cover?.coverBaseColor ?? new THREE.Color('#ffffff');

  return (
    <group position={position} rotation={rotation}>
      <mesh geometry={frontGeo} position={[coverX, 0, coverZFront]} castShadow receiveShadow>
        {cover ? (
          <CoverMaterial
            face="front" preset={presetProps}
            texture={cover.texture} coverAspect={cover.aspect}
            coverBaseColor={baseColor}
          />
        ) : <meshStandardMaterial {...presetProps} />}
      </mesh>

      <mesh geometry={backGeo} position={[coverX, 0, coverZBack]} castShadow receiveShadow>
        {cover ? (
          <CoverMaterial face="back" preset={presetProps} coverBaseColor={baseColor} />
        ) : <meshStandardMaterial {...presetProps} />}
      </mesh>

      <mesh geometry={spineGeo} position={[COVER_THICKNESS / 2, 0, 0]} castShadow receiveShadow>
        {cover ? (
          <CoverMaterial face="spine" preset={presetProps} coverBaseColor={baseColor} />
        ) : <meshStandardMaterial {...presetProps} />}
      </mesh>

      <mesh geometry={pageGeo} position={[pageX, 0, 0]} receiveShadow>
        <meshStandardMaterial
          {...PAGE_BLOCK_MATERIAL}
          normalMap={paperNormal}
          normalScale={new THREE.Vector2(1.8, 1.8)}
        />
      </mesh>
    </group>
  );
}

export { BOOK_DIMENSIONS };