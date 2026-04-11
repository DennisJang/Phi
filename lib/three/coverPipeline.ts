/**
 * coverPipeline — client-side adapter.
 *
 * Takes a cover URL (from /api/cover-proxy or /api/cover-upload) and
 * returns everything the 3D scene needs to render a book with
 * continuous color across front / spine / back.
 *
 * Output (CoverSample):
 *   - texture     : THREE.Texture bound from the same <img>
 *   - aspect      : naturalWidth / naturalHeight
 *   - colorTop    : average of the top edge row        (used for front letterbox top)
 *   - colorBottom : average of the bottom edge row     (used for front letterbox bottom)
 *   - colorCenter : 4-corner average, regression signal vs server sharp
 *   - spineColor  : luminance-min(top, bottom)         (used for spine + back solid fill)
 *   - dominantHex : legacy hex string = colorCenter, kept for Step-7-before callers
 *
 * Why 8x8 (not the server's 4x4):
 *   Top-row / bottom-row averaging needs enough horizontal samples per
 *   row that a narrow top band (e.g. Guns Germs Steel's NYT header) is
 *   not drowned by the image body. 4x4 gives only 4 pixels per row;
 *   8x8 gives 8 — noise well averaged, narrow bands still visible.
 *   Server stays at 4x4 and feeds colorCenter, which remains directly
 *   comparable via our own 4-corner sampler below — free regression
 *   signal for the day DB persistence lands (Step 7).
 *
 * Why luminance-min for spine:
 *   Spine sits on Phi Dark canvas (#1A1612). A light spine (e.g. a
 *   cover whose top band is a white NYT header) would punch a hole in
 *   the shelf silhouette. Choosing the darker of {top, bottom} as the
 *   spine base color keeps the book's visual weight anchored to the
 *   warm dark canvas, which is exactly what §18 Constrained Creativity
 *   asks for: one floor, predictable across any cover source.
 */
import * as THREE from 'three';

export interface CoverSample {
  texture: THREE.Texture;
  aspect: number;
  colorTop: THREE.Color;
  colorBottom: THREE.Color;
  colorCenter: THREE.Color;
  spineColor: THREE.Color;
  /** Legacy: hex of colorCenter. Kept for pre-Step-7 callers. */
  dominantHex: string;
}

const SAMPLE_GRID = 8;

interface RGB {
  r: number;
  g: number;
  b: number;
}

function sampleRow(data: Uint8ClampedArray, row: number): RGB {
  let r = 0;
  let g = 0;
  let b = 0;
  for (let x = 0; x < SAMPLE_GRID; x += 1) {
    const idx = (row * SAMPLE_GRID + x) * 4;
    r += data[idx];
    g += data[idx + 1];
    b += data[idx + 2];
  }
  return {
    r: Math.round(r / SAMPLE_GRID),
    g: Math.round(g / SAMPLE_GRID),
    b: Math.round(b / SAMPLE_GRID),
  };
}

function sampleFourCorners(data: Uint8ClampedArray): RGB {
  const last = SAMPLE_GRID - 1;
  const corners = [
    (0 * SAMPLE_GRID + 0) * 4,
    (0 * SAMPLE_GRID + last) * 4,
    (last * SAMPLE_GRID + 0) * 4,
    (last * SAMPLE_GRID + last) * 4,
  ];
  let r = 0;
  let g = 0;
  let b = 0;
  for (const idx of corners) {
    r += data[idx];
    g += data[idx + 1];
    b += data[idx + 2];
  }
  return {
    r: Math.round(r / 4),
    g: Math.round(g / 4),
    b: Math.round(b / 4),
  };
}

/** Rec. 709 relative luminance (sRGB gamma ignored; close enough for ranking). */
function luminance(c: RGB): number {
  return 0.2126 * c.r + 0.7152 * c.g + 0.0722 * c.b;
}

function pickSpine(top: RGB, bottom: RGB): RGB {
  return luminance(top) <= luminance(bottom) ? top : bottom;
}

function toThreeColor({ r, g, b }: RGB): THREE.Color {
  return new THREE.Color(r / 255, g / 255, b / 255);
}

function toHex({ r, g, b }: RGB): string {
  const h = (n: number) => n.toString(16).padStart(2, '0');
  return `#${h(r)}${h(g)}${h(b)}`;
}

interface SampledColors {
  top: RGB;
  bottom: RGB;
  center: RGB;
}

function sampleAll(img: HTMLImageElement): SampledColors {
  const canvas = document.createElement('canvas');
  canvas.width = SAMPLE_GRID;
  canvas.height = SAMPLE_GRID;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) {
    const black: RGB = { r: 0, g: 0, b: 0 };
    return { top: black, bottom: black, center: black };
  }
  ctx.drawImage(img, 0, 0, SAMPLE_GRID, SAMPLE_GRID);
  const { data } = ctx.getImageData(0, 0, SAMPLE_GRID, SAMPLE_GRID);
  return {
    top: sampleRow(data, 0),
    bottom: sampleRow(data, SAMPLE_GRID - 1),
    center: sampleFourCorners(data),
  };
}

/**
 * Load a cover image from a URL and produce the full CoverSample.
 * Rejects on network / CORS failure. The same <img> is used for both
 * the pixel sampling and the THREE.Texture, so no double-download.
 */
export function loadCoverFromUrl(url: string): Promise<CoverSample> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    // Required so getImageData doesn't throw SecurityError on a
    // tainted canvas. Supabase public buckets serve the right CORS
    // headers; /api/cover-proxy returns via the same bucket, so both
    // upload paths work out of the box.
    img.crossOrigin = 'anonymous';

    img.onload = () => {
      try {
        const { top, bottom, center } = sampleAll(img);
        const spine = pickSpine(top, bottom);

        const texture = new THREE.Texture(img);
        texture.colorSpace = THREE.SRGBColorSpace;
        texture.needsUpdate = true;

        resolve({
          texture,
          aspect: img.naturalWidth / img.naturalHeight,
          colorTop: toThreeColor(top),
          colorBottom: toThreeColor(bottom),
          colorCenter: toThreeColor(center),
          spineColor: toThreeColor(spine),
          dominantHex: toHex(center),
        });
      } catch (err) {
        reject(err instanceof Error ? err : new Error(String(err)));
      }
    };

    img.onerror = () => {
      reject(new Error(`Failed to load cover image: ${url}`));
    };

    img.src = url;
  });
}