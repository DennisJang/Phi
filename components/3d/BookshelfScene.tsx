'use client';

/**
 * BookshelfScene — horizontal shelf view (spine-on with 15° yaw).
 *
 * Camera composition:
 * - Book stands upright in its base pose (no book-side rotation).
 * - Camera is positioned on a circular arc around the book's center,
 *   at Y=0 (level with the book's midline — zero pitch).
 * - Yaw angle SHELF_YAW_RAD (15°) offsets the camera from the straight-on
 *   spine view, revealing a sliver of the front cover edge. This is the
 *   Stripe Press 3/4 silhouette in its purest form: spine dominant, cover
 *   a hint, top and bottom never seen.
 *
 * Why pitch = 0:
 * Pitch would introduce vertical perspective distortion — the spine's
 * rectangle would become a trapezoid and the book's top face would
 * appear. The user specified a level horizontal gaze; distortion must
 * come only from the yaw offset.
 *
 * See PROJECT_KNOWLEDGE.md §20.3 "Horizontal layout primitives".
 */

import { Canvas } from '@react-three/fiber';
import { Environment, OrbitControls } from '@react-three/drei';
import { Suspense } from 'react';
import { BookModel, BOOK_DIMENSIONS } from './BookModel';
import { PerfPanel } from './PerfPanel';
import { SHELF_YAW_RAD, PHI } from '@/lib/phi/ratios';

/**
 * Camera placement.
 *
 * Book center sits at (halfWidth, 0, 0) because BookModel's origin is the
 * spine hinge and the book extends along +X. The camera orbits this
 * center on a horizontal circle of radius CAMERA_DISTANCE.
 *
 * At yaw = 0 the camera looks straight at the spine from -X.
 * At yaw = +15° the camera has swung toward the front cover side.
 */
const CAMERA_DISTANCE = PHI * 2.5;
const BOOK_CENTER_X = BOOK_DIMENSIONS.width / 2;

const CAMERA_X = BOOK_CENTER_X - CAMERA_DISTANCE * Math.cos(SHELF_YAW_RAD);
const CAMERA_Y = 0; // level — no pitch, no top/bottom visible
const CAMERA_Z = CAMERA_DISTANCE * Math.sin(SHELF_YAW_RAD);

export function BookshelfScene() {
  return (
    <Canvas
      shadows
      dpr={[1, 2]}
      camera={{
        position: [CAMERA_X, CAMERA_Y, CAMERA_Z],
        fov: 35,
        near: 0.1,
        far: 100,
      }}
      gl={{
        antialias: true,
        alpha: true,
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

      {/* Subtle rim light from opposite side */}
      <directionalLight
        position={[-3, 2, -2]}
        intensity={0.4}
        color="#7B9EBF"
      />

      {/* PBR environment — "apartment" is warm indoor lighting */}
      <Suspense fallback={null}>
        <Environment preset="apartment" background={false} />
      </Suspense>

      {/* The hero object in its base pose — no rotation applied */}
      <BookModel
        preset="hardcover"
        coverImageUrl="https://picsum.photos/seed/phi-book-1/1024/1536"
      />

      {/* Ground plane to receive shadows */}
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, -1.1, 0]}
        receiveShadow
      >
        <planeGeometry args={[20, 20]} />
        <shadowMaterial opacity={0.3} />
      </mesh>

      {/*
        Desktop-only inspection controls. Target is the book's center
        (spine hinge + halfWidth), not the origin — otherwise the orbit
        would pivot around the spine edge and the book would drift.
      */}
      <OrbitControls
        enablePan={false}
        minDistance={2}
        maxDistance={10}
        target={[BOOK_CENTER_X, 0, 0]}
      />

      {/* FPS / drawcall overlay — dev only */}
      <PerfPanel />
    </Canvas>
  );
}