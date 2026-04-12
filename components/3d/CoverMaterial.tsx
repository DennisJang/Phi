'use client';
import { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { BOOK_DIMENSIONS } from '@/lib/three/bookDimensions';
import type { MaterialPresetProps } from '@/lib/three/materials';

export type CoverFace = 'front' | 'spine' | 'back';

export interface CoverMaterialProps {
  face: CoverFace;
  preset: MaterialPresetProps;
  /**
   * Front face: full cover image (letterbox composited).
   * Spine face: generated spine texture (1:1 straight UV, no letterbox).
   * Back face: not used yet; solid color only.
   */
  texture?: THREE.Texture;
  /** Required when face='front' and texture is present (for letterbox math). */
  coverAspect?: number;
  coverBaseColor: THREE.Color;
}

interface U {
  uHasTexture: { value: number };
  /** 0 = solid, 1 = front letterbox, 2 = spine straight-UV */
  uFaceKind: { value: number };
  uMap: { value: THREE.Texture | null };
  uCoverBaseColor: { value: THREE.Color };
  uCoverAspect: { value: number };
  uFaceAspect: { value: number };
}

function createPatched(preset: MaterialPresetProps) {
  const material = new THREE.MeshStandardMaterial({
    color: '#ffffff',
    roughness: preset.roughness,
    metalness: preset.metalness,
  });
  const uniforms: U = {
    uHasTexture: { value: 0 },
    uFaceKind: { value: 0 },
    uMap: { value: null },
    uCoverBaseColor: { value: new THREE.Color('#ffffff') },
    uCoverAspect: { value: 1 },
    uFaceAspect: { value: BOOK_DIMENSIONS.width / BOOK_DIMENSIONS.height },
  };
  material.onBeforeCompile = (shader) => {
    Object.assign(shader.uniforms, uniforms);
    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', '#include <common>\nvarying vec2 vCoverUv;')
      .replace('#include <uv_vertex>', '#include <uv_vertex>\nvCoverUv = uv;');
    shader.fragmentShader = shader.fragmentShader
      .replace(
        '#include <common>',
        `#include <common>
        uniform float uHasTexture;
        uniform float uFaceKind;
        uniform sampler2D uMap;
        uniform vec3 uCoverBaseColor;
        uniform float uCoverAspect;
        uniform float uFaceAspect;
        varying vec2 vCoverUv;`
      )
      .replace(
        '#include <color_fragment>',
        `#include <color_fragment>
        {
          vec3 phiColor = uCoverBaseColor;
          if (uHasTexture > 0.5) {
            if (uFaceKind > 1.5) {
              // Spine: straight 1:1 UV, no letterbox.
              phiColor = texture2D(uMap, vCoverUv).rgb;
            } else {
              // Front: letterbox into face aspect.
              vec2 fuv = vCoverUv;
              bool inside = true;
              if (uCoverAspect > uFaceAspect) {
                float s = uFaceAspect / uCoverAspect;
                float o = (1.0 - s) * 0.5;
                float m = (fuv.y - o) / s;
                if (m < 0.0 || m > 1.0) inside = false;
                else fuv.y = m;
              } else {
                float s = uCoverAspect / uFaceAspect;
                float o = (1.0 - s) * 0.5;
                float m = (fuv.x - o) / s;
                if (m < 0.0 || m > 1.0) inside = false;
                else fuv.x = m;
              }
              if (inside) phiColor = texture2D(uMap, fuv).rgb;
            }
          }
          diffuseColor.rgb = phiColor;
        }`
      );
  };
  material.needsUpdate = true;
  return { material, uniforms };
}

export function CoverMaterial({
  face, preset, texture, coverAspect, coverBaseColor,
}: CoverMaterialProps) {
  const built = useMemo(
    () => createPatched(preset),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [preset.roughness, preset.metalness]
  );
  const last = useRef(built);
  last.current = built;

  useEffect(() => {
    const u = built.uniforms;
    u.uCoverBaseColor.value.copy(coverBaseColor);

    if (face === 'front' && texture && coverAspect) {
      u.uHasTexture.value = 1;
      u.uFaceKind.value = 1; // letterbox
      u.uMap.value = texture;
      u.uCoverAspect.value = coverAspect;
    } else if (face === 'spine' && texture) {
      u.uHasTexture.value = 1;
      u.uFaceKind.value = 2; // straight-UV
      u.uMap.value = texture;
    } else {
      u.uHasTexture.value = 0;
      u.uFaceKind.value = 0;
      u.uMap.value = null;
    }
    u.uFaceAspect.value = BOOK_DIMENSIONS.width / BOOK_DIMENSIONS.height;
  }, [built, face, texture, coverAspect, coverBaseColor]);

  useEffect(() => () => { built.material.dispose(); }, [built]);

  return <primitive object={built.material} attach="material" />;
}