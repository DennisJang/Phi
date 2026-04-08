'use client';

/**
 * BookshelfScene — root R3F canvas for the 3D bookshelf.
 *
 * Scene composition (from design spec §3D lighting):
 * - Single warm key light, 45° top-right
 * - Soft ambient hemisphere fill
 * - Environment map for PBR reflections on leather/glass
 *
 * Why OrbitControls is enabled:
 * Desktop-only inspection tool during Phase 1. Will be replaced with
 * custom gesture handlers (pinch/rotate) in Phase 2 when we move to
 * tablet-first interaction.
 */

import { Canvas } from '@react-three/fiber';
import { Environment, OrbitControls } from '@react-three/drei';
import { Suspense } from 'react';
import { BookModel } from './BookModel';
import { PerfPanel } from './PerfPanel';

export function BookshelfScene() {
  return (
    <Canvas
      shadows
      dpr={[1, 2]} // Cap pixel ratio at 2 — prevents retina perf cliff
      camera={{
        position: [3, 2, 4],
        fov: 35,
        near: 0.1,
        far: 100,
      }}
      gl={{
        antialias: true,
        alpha: true, // transparent canvas, lets Tailwind bg show through
      }}
      style={{ background: 'transparent' }}
    >
      {/* Ambient hemisphere — warm sky, cooler ground. Soft fill. */}
      <hemisphereLight args={['#F5E6D3', '#1a1410', 0.3]} />

      {/* Key light — warm white, top-right, casts shadows */}
      <directionalLight
        position={[5, 6, 3]}
        intensity={2.5}
        color="#FFF4E6"
        castShadow
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
        shadow-camera-near={0.5}
        shadow-camera-far={20}
        shadow-camera-left={-5}
        shadow-camera-right={5}
        shadow-camera-top={5}
        shadow-camera-bottom={-5}
      />

      {/* Subtle rim light from opposite side — separates object from dark bg */}
      <directionalLight
        position={[-3, 2, -2]}
        intensity={0.4}
        color="#7B9EBF"
      />

      {/* PBR environment — "apartment" is warm indoor lighting */}
      <Suspense fallback={null}>
        <Environment preset="apartment" background={false} />
      </Suspense>

      {/* The hero object */}
      <BookModel preset="hardcover" />

      {/* Ground plane to receive shadows — invisible but catches shadow */}
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, -1.1, 0]}
        receiveShadow
      >
        <planeGeometry args={[20, 20]} />
        <shadowMaterial opacity={0.3} />
      </mesh>

      {/* Desktop-only inspection controls. Phase 2 replaces these. */}
      <OrbitControls
        enablePan={false}
        minDistance={2}
        maxDistance={10}
        target={[0.7, 0, 0]}
      />

      {/* FPS / drawcall overlay — dev only, tree-shaken in production */}
      <PerfPanel />
    </Canvas>
  );
}