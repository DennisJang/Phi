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
 * Step 5d: scene drives the spine-generation chain for the dev test book.
 * In production (post Step 7) this logic moves out — each book row in
 * the bookshelf store will carry pre-computed { coverUrl, spineUrl,
 * dominantHex } and BookModel will be a dumb consumer. For Phase 1 dev
 * verification, the scene performs: load cover → sample dominantHex →
 * POST /api/spine-generate → pass both URLs to BookModel.
 *
 * See PROJECT_KNOWLEDGE.md §20.3 "Horizontal layout primitives".
 */

import { Canvas } from '@react-three/fiber';
import { Environment, OrbitControls } from '@react-three/drei';
import { Suspense, useEffect, useState } from 'react';
import { BookModel, BOOK_DIMENSIONS } from './BookModel';
import { PerfPanel } from './PerfPanel';
import { SHELF_YAW_RAD, PHI } from '@/lib/phi/ratios';
import { loadCoverFromUrl } from '@/lib/three/coverPipeline';

/**
 * DEV-ONLY seed values for Step 4e/5d visual verification.
 *
 * The cover URL is a real image processed through /api/cover-upload.
 * Title/author/language are dev constants that feed into spine
 * generation. All three are removed in Step 7 when the real book-add
 * flow replaces this with store-driven data.
 *
 * TODO (Step 7): remove these constants and drive all props from the
 * books store / add-book flow.
 */
const DEV_TEST_COVER_URL =
  'https://trbeccbsjnxdkzxlecvv.supabase.co/storage/v1/object/public/covers/561aa935-b76b-403d-a6a7-b98638620116/40c8d5cec3a6b5c3d7ed46a01eced3ef7353b6b7.webp';
const DEV_TEST_TITLE = '데미안';
const DEV_TEST_AUTHOR = '헤르만 헤세';
const DEV_TEST_LANGUAGE: 'ko' | 'en' = 'ko';

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

/**
 * Step 5d dev hook: sample dominantHex from cover, then POST to
 * /api/spine-generate. Returns the generated spine URL when ready.
 *
 * Not memoized across books — dev-only path for a single hard-coded
 * book. Production flow (Step 7+) reads spine URL from the books row.
 */
function useDevSpineUrl(
  coverUrl: string,
  title: string,
  author: string,
  language: 'ko' | 'en',
): string | undefined {
  const [spineUrl, setSpineUrl] = useState<string | undefined>(undefined);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const sample = await loadCoverFromUrl(coverUrl);
        // We only need the hex; dispose the THREE.Texture immediately.
        const dominantHex = sample.dominantHex;
        sample.texture.dispose();

        const res = await fetch('/api/spine-generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title,
            author,
            coverBaseColor: dominantHex,
            language,
          }),
        });
        if (!res.ok) {
          const body: unknown = await res.json().catch(() => null);
          console.error('[BookshelfScene/spine] HTTP', res.status, body);
          return;
        }
        const json = (await res.json()) as
          | { ok: true; data: { url: string } }
          | { ok: false; error: unknown };
        if (!json.ok) {
          console.error('[BookshelfScene/spine] server error', json.error);
          return;
        }
        if (!cancelled) setSpineUrl(json.data.url);
      } catch (e) {
        if (!cancelled) console.error('[BookshelfScene/spine]', e);
      }
    })();
    return () => { cancelled = true; };
  }, [coverUrl, title, author, language]);

  return spineUrl;
}

export function BookshelfScene() {
  const spineUrl = useDevSpineUrl(
    DEV_TEST_COVER_URL,
    DEV_TEST_TITLE,
    DEV_TEST_AUTHOR,
    DEV_TEST_LANGUAGE,
  );

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
      {/* Ambient base — minimal, so normalMap detail survives */}
      <hemisphereLight args={['#F5E6D3', '#1a1410', 0.15]} />

      {/* Key light — warm, lowered to y=2 for grazing angle on book faces */}
      <directionalLight
        position={[4, 2, 3]}
        intensity={2.8}
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

      {/* Grazing rim light — near-horizontal from +X side.
          This light's ray hits the page block's fore-edge (+X normal)
          and top/bottom faces at a shallow angle, revealing the
          horizontal normalMap stripes. This is the Stripe Press effect:
          grazing light dramatizes paper grain that normal light flattens. */}
      <directionalLight
        position={[6, 0.3, 0]}
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

      {/* Environment — LOW intensity so directional lights dominate.
          apartment preset is still useful for PBR reflections on the
          cover, but must not wash out the normalMap. */}
      <Suspense fallback={null}>
        <Environment preset="apartment" background={false} environmentIntensity={0.25} />
      </Suspense>

      {/* The hero object in its base pose — no rotation applied */}
      <BookModel
        preset="hardcover"
        coverImageUrl={DEV_TEST_COVER_URL}
        spineImageUrl={spineUrl}
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