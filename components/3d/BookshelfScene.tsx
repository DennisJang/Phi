'use client';

/**
 * BookshelfScene — horizontal shelf view, DB-driven.
 *
 * Receives an array of Book rows (with pre-computed cover + spine URLs
 * per §9 Step 5 closure) and renders N BookModel instances arranged
 * along world +X, each rotated Y+90° so its spine face points toward +Z.
 *
 * Coordinate rationale:
 * - BookModel's local frame: spine hinge at origin, book extends +X,
 *   spine face is the -X face of a (COVER_THICKNESS × H × T) box.
 * - Y+90° rotation maps local -X → world +Z, so the spine faces the
 *   camera. After rotation, each book occupies world X range
 *   [-T/2, +T/2] around its position.
 * - Books are centered on world origin: book i sits at
 *   x = -((n-1)/2) * stride + i * stride.  This keeps the lighting,
 *   ground plane, and orbit target tied to the origin regardless of
 *   shelf length.
 *
 * Camera composition:
 * - Y=0 (pitch 0 — §9 documented exception).  Any pitch trapezoids the
 *   spine rectangles and exposes the book tops.
 * - Yaw SHELF_YAW_RAD (15°) reveals a sliver of the front-cover edge
 *   along +X.  Same 15° used since Step 4f, now applied to the shelf
 *   as a whole.
 * - Distance auto-scales to frame the full shelf width at the current
 *   FOV, with a floor of PHI × 2.5 (the single-book framing distance)
 *   so a 1-book scene reads the same as before.
 *
 * See PROJECT_KNOWLEDGE.md §20.3 "Horizontal layout primitives".
 */

import { Canvas } from '@react-three/fiber';
import { Environment, OrbitControls } from '@react-three/drei';
import { Suspense } from 'react';
import { BookModel, BOOK_DIMENSIONS } from './BookModel';
import { PerfPanel } from './PerfPanel';
import { SHELF_YAW_RAD, PHI } from '@/lib/phi/ratios';
import type { Book } from '@/types/book';

export interface BookshelfSceneProps {
  books: Book[];
}

/** Each rotated book occupies BOOK_DIMENSIONS.thickness of world X. */
const T = BOOK_DIMENSIONS.thickness;

/**
 * Air gap between adjacent spines.  10% of thickness reads as "spines
 * touch but don't crush" per Stripe Press reference.  To be refined
 * during spine typography tuning (next session goal).
 */
const SHELF_GAP = T * 0.1;
const BOOK_STRIDE = T + SHELF_GAP;

/** Y-axis rotation that points each book's spine face toward +Z. */
const BOOK_YAW = Math.PI / 2;

/** Single-book framing distance — floor for multi-book auto-fit. */
const MIN_CAMERA_DISTANCE = PHI * 2.5;

const CAMERA_FOV_DEG = 35;

function computeLayout(nBooks: number) {
  const shelfWidth = Math.max(1, nBooks) * BOOK_STRIDE;
  const firstBookX = -((nBooks - 1) * BOOK_STRIDE) / 2;

  const fovRad = (CAMERA_FOV_DEG * Math.PI) / 180;
  const minDistForWidth = shelfWidth / 2 / Math.tan(fovRad / 2);
  const distance = Math.max(MIN_CAMERA_DISTANCE, minDistForWidth * 0.9);

  const cameraX = distance * Math.sin(SHELF_YAW_RAD);
  const cameraZ = distance * Math.cos(SHELF_YAW_RAD);

  return { firstBookX, cameraX, cameraZ, distance, shelfWidth };
}

export function BookshelfScene({ books }: BookshelfSceneProps) {
  const { firstBookX, cameraX, cameraZ, distance, shelfWidth } =
    computeLayout(books.length);

  return (
    <Canvas
      shadows
      dpr={[1, 2]}
      camera={{
        position: [cameraX, 0, cameraZ],
        fov: CAMERA_FOV_DEG,
        near: 0.1,
        far: 100,
      }}
      gl={{ antialias: true, alpha: true }}
      style={{ background: 'transparent' }}
    >
      {/* Ambient base — minimal, so normalMap detail survives */}
      <hemisphereLight args={['#F5E6D3', '#1a1410', 0.15]} />

      {/* Key light — warm, y=2 for grazing angle on book faces.
          Shadow frustum scales with shelf width so all books receive
          and cast shadows. */}
      <directionalLight
        position={[4, 2, 3]}
        intensity={2.8}
        color="#FFF4E6"
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-near={0.5}
        shadow-camera-far={distance + 10}
        shadow-camera-left={-(shelfWidth / 2 + 2)}
        shadow-camera-right={shelfWidth / 2 + 2}
        shadow-camera-top={3}
        shadow-camera-bottom={-3}
      />

      {/* Grazing rim light — near-horizontal along +Z, rakes the spine
          row from the front.  Reveals horizontal page-block normalMap
          stripes at the fore-edge (Stripe Press grain). */}
      <directionalLight
        position={[0, 0.3, 6]}
        intensity={1.6}
        color="#FFE8CC"
        castShadow={false}
      />

      {/* Cool fill from behind — keeps shadow side from going flat black */}
      <directionalLight
        position={[-3, 1, -2]}
        intensity={0.3}
        color="#7B9EBF"
      />

      {/* Environment — LOW intensity so directional lights dominate. */}
      <Suspense fallback={null}>
        <Environment
          preset="apartment"
          background={false}
          environmentIntensity={0.25}
        />
      </Suspense>

      {/* The shelf: N books centered on origin, each spine facing +Z. */}
      {books.map((book, i) => (
        <BookModel
          key={book.id}
          preset="hardcover"
          coverImageUrl={book.cover_image_url ?? undefined}
          spineImageUrl={book.spine_image_url ?? undefined}
          position={[firstBookX + i * BOOK_STRIDE, 0, 0]}
          rotation={[0, BOOK_YAW, 0]}
        />
      ))}

      {/* Ground plane — scales with shelf to receive all shadows */}
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, -1.1, 0]}
        receiveShadow
      >
        <planeGeometry args={[Math.max(20, shelfWidth + 4), 20]} />
        <shadowMaterial opacity={0.3} />
      </mesh>

      {/* Desktop-only inspection controls — target is shelf center (origin).
          Zoom bounds scale with distance so the controls feel consistent
          regardless of book count. */}
      <OrbitControls
        enablePan={false}
        minDistance={Math.max(2, distance * 0.4)}
        maxDistance={distance * 2.5}
        target={[0, 0, 0]}
      />

      {/* FPS / drawcall overlay — dev only */}
      <PerfPanel />
    </Canvas>
  );
}