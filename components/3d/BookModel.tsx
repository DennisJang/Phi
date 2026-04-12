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

/**
 * Lightweight texture loader for spine textures (Step 5c).
 * Unlike useCoverSample, no pixel sampling — the generator already
 * produces a face-matched texture; we just need to bind it.
 */
function useSpineTexture(url: string | undefined): THREE.Texture | null {
  const [tex, setTex] = useState<THREE.Texture | null>(null);
  useEffect(() => {
    if (!url) { setTex(null); return; }
    let cancelled = false;
    const loader = new THREE.TextureLoader();
    loader.setCrossOrigin('anonymous');
    loader.load(
      url,
      (next) => {
        if (cancelled) { next.dispose(); return; }
        next.colorSpace = THREE.SRGBColorSpace;
        next.anisotropy = 8;
        next.needsUpdate = true;
        setTex((prev) => { prev?.dispose(); return next; });
      },
      undefined,
      (e) => !cancelled && console.error('[BookModel/spine]', e),
    );
    return () => { cancelled = true; };
  }, [url]);
  useEffect(() => () => {
    setTex((prev) => { prev?.dispose(); return null; });
  }, []);
  return tex;
}

export interface BookModelProps {
  preset?: MaterialPresetName;
  coverImageUrl?: string;
  /** Generated spine texture URL (Step 5). Optional — falls back to solid color. */
  spineImageUrl?: string;
  position?: [number, number, number];
  rotation?: [number, number, number];
}

export function BookModel({
  preset = 'hardcover', coverImageUrl, spineImageUrl,
  position = [0, 0, 0], rotation = [0, 0, 0],
}: BookModelProps) {
  const presetProps = MATERIAL_PRESETS[preset];
  const cover = useCoverSample(coverImageUrl);
  const spineTex = useSpineTexture(spineImageUrl);
  const paperNormal = useMemo(() => getPaperNormalTexture(), []);

  const frontGeo = useBox(W, H, COVER_THICKNESS);
  const backGeo = useBox(W, H, COVER_THICKNESS);
  const spineGeo = useBox(COVER_THICKNESS, H, T);
  const pageGeo = useBox(
    W - COVER_THICKNESS - PAGE_INSET,
    H - PAGE_INSET * 2,
    T - COVER_THICKNESS * 2
  );

  const halfT = T / 2;
  const coverZFront = halfT - COVER_THICKNESS / 2;
  const coverZBack = -halfT + COVER_THICKNESS / 2;
  const coverX = W / 2;
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
          <CoverMaterial
            face="spine" preset={presetProps}
            texture={spineTex ?? undefined}
            coverBaseColor={baseColor}
          />
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