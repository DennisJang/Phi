'use client';

/**
 * CoverMaterial — letterbox shader for the front cover face.
 *
 * Composites a cover texture onto the book's front face using UV
 * remapping. Cover aspect rarely matches face aspect (1:φ), so the
 * shader scales the cover to fit along the tighter axis and fills
 * the remainder with dominantColor — the "melts into the book
 * surface" effect (§9 Decisions Log, Q8-c).
 *
 * TRADEOFF: uses THREE.ShaderMaterial, so the front face does NOT
 * receive PBR lighting from the scene. Back cover and spine still
 * use meshStandardMaterial and keep warm lighting. If the visual
 * difference is too loud, Phase 2 may port this to onBeforeCompile
 * patching of meshStandardMaterial.
 */
import { useEffect, useMemo } from 'react';
import * as THREE from 'three';
import { BOOK_DIMENSIONS } from './BookModel';

const VERT = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const FRAG = /* glsl */ `
  uniform sampler2D uMap;
  uniform vec3 uDominantColor;
  uniform float uCoverAspect;
  uniform float uFaceAspect;
  varying vec2 vUv;

  void main() {
    vec2 uv = vUv;
    if (uCoverAspect > uFaceAspect) {
      // Cover wider than face → letterbox top/bottom
      float scale = uFaceAspect / uCoverAspect;
      float offset = (1.0 - scale) * 0.5;
      float mapped = (uv.y - offset) / scale;
      if (mapped < 0.0 || mapped > 1.0) {
        gl_FragColor = vec4(uDominantColor, 1.0);
        return;
      }
      uv.y = mapped;
    } else {
      // Cover taller than face → pillarbox left/right
      float scale = uCoverAspect / uFaceAspect;
      float offset = (1.0 - scale) * 0.5;
      float mapped = (uv.x - offset) / scale;
      if (mapped < 0.0 || mapped > 1.0) {
        gl_FragColor = vec4(uDominantColor, 1.0);
        return;
      }
      uv.x = mapped;
    }
    gl_FragColor = texture2D(uMap, uv);
  }
`;

export interface CoverMaterialProps {
  texture: THREE.Texture;
  dominantColor: string;
  coverAspect: number;
}

export function CoverMaterial({ texture, dominantColor, coverAspect }: CoverMaterialProps) {
  const faceAspect = BOOK_DIMENSIONS.width / BOOK_DIMENSIONS.height;

  const material = useMemo(() => {
    return new THREE.ShaderMaterial({
      vertexShader: VERT,
      fragmentShader: FRAG,
      uniforms: {
        uMap: { value: texture },
        uDominantColor: { value: new THREE.Color(dominantColor) },
        uCoverAspect: { value: coverAspect },
        uFaceAspect: { value: faceAspect },
      },
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Update uniforms without rebuilding the material
  useEffect(() => {
    material.uniforms.uMap.value = texture;
    material.uniforms.uDominantColor.value.set(dominantColor);
    material.uniforms.uCoverAspect.value = coverAspect;
    material.uniforms.uFaceAspect.value = faceAspect;
  }, [material, texture, dominantColor, coverAspect, faceAspect]);

  // GPU cleanup on unmount
  useEffect(() => () => material.dispose(), [material]);

  return <primitive object={material} attach="material" />;
}