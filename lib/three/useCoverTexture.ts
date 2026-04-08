'use client';

/**
 * useCoverTexture — loads an image URL as a THREE.Texture.
 *
 * Why a custom hook instead of drei's useTexture / useLoader:
 * - useLoader throws for Suspense, which makes optional URLs awkward
 * - We need precise control over sRGB color space and disposal
 * - Phase 1 next step (Step 4.5) centralizes caching here without
 *   touching call sites. See STATUS.md next task queue.
 *
 * Color space note:
 * Three.js r152+ outputs sRGB. TextureLoader returns linear by default,
 * so covers render washed out unless we explicitly tag them sRGB.
 */

import { useEffect, useState } from 'react';
import * as THREE from 'three';

export type CoverTextureStatus = 'idle' | 'loading' | 'loaded' | 'error';

interface UseCoverTextureResult {
  texture: THREE.Texture | null;
  status: CoverTextureStatus;
}

export function useCoverTexture(url: string | undefined): UseCoverTextureResult {
  const [texture, setTexture] = useState<THREE.Texture | null>(null);
  const [status, setStatus] = useState<CoverTextureStatus>('idle');

  useEffect(() => {
    if (!url) {
      setTexture(null);
      setStatus('idle');
      return;
    }

    let cancelled = false;
    const loader = new THREE.TextureLoader();
    // Required for cross-origin covers (Aladin, Supabase Storage, Picsum)
    loader.setCrossOrigin('anonymous');

    setStatus('loading');

    loader.load(
      url,
      (loaded) => {
        if (cancelled) {
          loaded.dispose();
          return;
        }
        loaded.colorSpace = THREE.SRGBColorSpace;
        loaded.anisotropy = 8;
        loaded.needsUpdate = true;
        setTexture(loaded);
        setStatus('loaded');
      },
      undefined,
      (err) => {
        if (cancelled) return;
        console.warn('[useCoverTexture] failed to load cover', { url, err });
        setStatus('error');
        setTexture(null);
      }
    );

    return () => {
      cancelled = true;
    };
  }, [url]);

  // Separate disposal effect: fires when texture instance changes or unmounts.
  // Combining with the loader effect would dispose immediately after load.
  useEffect(() => {
    return () => {
      texture?.dispose();
    };
  }, [texture]);

  return { texture, status };
}