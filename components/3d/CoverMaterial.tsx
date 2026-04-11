'use client';

/**
 * CoverMaterial v2 — unified book-face material.
 *
 * v1 injected at `<map_fragment>` which is USE_MAP-gated. Since we
 * don't set material.map, that chunk was empty, replace() silently
 * matched nothing, and the shader failed to compile with
 * VALIDATE_STATUS false. v2 injects at `<color_fragment>` (always
 * present) and uses a private `vCoverUv` varying so we don't depend
 * on three.js's internal vUv (also USE_MAP-gated).
 *
 * Strategy otherwise unchanged:
 *   - meshStandardMaterial patched via onBeforeCompile → keeps PBR
 *   - uHasTexture = 0 → solid uColorTop fill (spine / back)
 *   - uHasTexture = 1 → letterbox image with colorTop / colorBottom fill
 */

import { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { BOOK_DIMENSIONS } from '@/lib/three/bookDimensions';
import type { MaterialPresetProps } from '@/lib/three/materials';

export type CoverFace = 'front' | 'spine' | 'back';

export interface CoverMaterialProps {
  face: CoverFace;
  preset: MaterialPresetProps;
  texture?: THREE.Texture;
  coverAspect?: number;
  colorTop: THREE.Color;
  colorBottom: THREE.Color;
}

interface PatchedUniforms {
  uHasTexture: { value: number };
  uMap: { value: THREE.Texture | null };
  uColorTop: { value: THREE.Color };
  uColorBottom: { value: THREE.Color };
  uCoverAspect: { value: number };
  uFaceAspect: { value: number };
}

function createPatchedMaterial(preset: MaterialPresetProps): {
  material: THREE.MeshStandardMaterial;
  uniforms: PatchedUniforms;
} {
  const material = new THREE.MeshStandardMaterial({
    color: '#ffffff',
    roughness: preset.roughness,
    metalness: preset.metalness,
  });

  const uniforms: PatchedUniforms = {
    uHasTexture: { value: 0 },
    uMap: { value: null },
    uColorTop: { value: new THREE.Color('#ffffff') },
    uColorBottom: { value: new THREE.Color('#ffffff') },
    uCoverAspect: { value: 1 },
    uFaceAspect: { value: BOOK_DIMENSIONS.width / BOOK_DIMENSIONS.height },
  };

  material.onBeforeCompile = (shader) => {
    Object.assign(shader.uniforms, uniforms);

    // Vertex: declare + write our own UV varying
    shader.vertexShader = shader.vertexShader.replace(
      '#include <common>',
      `#include <common>
      varying vec2 vCoverUv;`
    );
    shader.vertexShader = shader.vertexShader.replace(
      '#include <uv_vertex>',
      `#include <uv_vertex>
      vCoverUv = uv;`
    );

    // Fragment: declare uniforms + varying
    shader.fragmentShader = shader.fragmentShader.replace(
      '#include <common>',
      `#include <common>
      uniform float uHasTexture;
      uniform sampler2D uMap;
      uniform vec3 uColorTop;
      uniform vec3 uColorBottom;
      uniform float uCoverAspect;
      uniform float uFaceAspect;
      varying vec2 vCoverUv;`
    );

    // Fragment: override diffuseColor after <color_fragment> initializes it
    shader.fragmentShader = shader.fragmentShader.replace(
      '#include <color_fragment>',
      `#include <color_fragment>
      {
        vec3 phiColor;
        if (uHasTexture < 0.5) {
          phiColor = uColorTop;
        } else {
          vec2 fuv = vCoverUv;
          if (uCoverAspect > uFaceAspect) {
            float scale = uFaceAspect / uCoverAspect;
            float offset = (1.0 - scale) * 0.5;
            float mapped = (fuv.y - offset) / scale;
            if (mapped < 0.0) {
              phiColor = uColorBottom;
            } else if (mapped > 1.0) {
              phiColor = uColorTop;
            } else {
              fuv.y = mapped;
              phiColor = texture2D(uMap, fuv).rgb;
            }
          } else {
            float scale = uCoverAspect / uFaceAspect;
            float offset = (1.0 - scale) * 0.5;
            float mapped = (fuv.x - offset) / scale;
            if (mapped < 0.0 || mapped > 1.0) {
              phiColor = uColorTop;
            } else {
              fuv.x = mapped;
              phiColor = texture2D(uMap, fuv).rgb;
            }
          }
        }
        diffuseColor.rgb = phiColor;
      }
      `
    );

    if (process.env.NODE_ENV !== 'production') {
      // eslint-disable-next-line no-console
      console.debug('[CoverMaterial] onBeforeCompile fired');
    }
  };

  material.needsUpdate = true;
  return { material, uniforms };
}

export function CoverMaterial({
  face,
  preset,
  texture,
  coverAspect,
  colorTop,
  colorBottom,
}: CoverMaterialProps) {
  const ref = useRef<{
    material: THREE.MeshStandardMaterial;
    uniforms: PatchedUniforms;
  } | null>(null);

  const built = useMemo(() => {
    const next = createPatchedMaterial(preset);
    ref.current = next;
    return next;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [preset.roughness, preset.metalness]);

  useEffect(() => {
    const u = built.uniforms;
    u.uColorTop.value.copy(colorTop);
    u.uColorBottom.value.copy(colorBottom);

    if (face === 'front' && texture && coverAspect) {
      u.uHasTexture.value = 1;
      u.uMap.value = texture;
      u.uCoverAspect.value = coverAspect;
    } else {
      u.uHasTexture.value = 0;
      u.uMap.value = null;
      u.uCoverAspect.value = 1;
    }
    u.uFaceAspect.value = BOOK_DIMENSIONS.width / BOOK_DIMENSIONS.height;
  }, [built, face, texture, coverAspect, colorTop, colorBottom]);

  useEffect(() => {
    const current = built.material;
    return () => {
      current.dispose();
    };
  }, [built]);

  return <primitive object={built.material} attach="material" />;
}