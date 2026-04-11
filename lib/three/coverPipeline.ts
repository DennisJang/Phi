/**
 * coverPipeline — client-side adapter.
 *
 * Takes a cover URL (from /api/cover-proxy or /api/cover-upload) and
 * returns everything the 3D scene needs:
 *   - A THREE.Texture ready to bind to a material
 *   - The cover's dominantColor (recomputed client-side, 4-corner)
 *   - The cover's aspect ratio (naturalWidth / naturalHeight)
 *
 * Why recompute dominantColor on the client?
 * The server (/api/cover-*) already extracts it via sharp and returns
 * it in the JSON response, but we don't persist that response anywhere
 * yet (Step 7 will wire DB writes). Until then, the URL is the only
 * thing we carry forward — so we must recompute from pixels.
 *
 * The algorithm matches the server's: downscale to 4×4 and average the
 * four corner pixels. This means client and server dominantColor agree
 * to within downscaling noise, giving us a free regression signal when
 * we eventually compare them.
 *
 * Single image fetch: the same HTMLImageElement is used for both the
 * pixel sampling AND the THREE.Texture, so we don't download twice.
 */
import * as THREE from 'three';

export interface CoverPipelineResult {
  texture: THREE.Texture;
  dominantColor: string; // '#RRGGBB'
  coverAspect: number;   // width / height
}

/** Downscale to 4×4 and average the 4 corner pixels. Matches server sharp logic. */
function extractDominantColor(img: HTMLImageElement): string {
  const canvas = document.createElement('canvas');
  canvas.width = 4;
  canvas.height = 4;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) {
    return '#000000';
  }
  ctx.drawImage(img, 0, 0, 4, 4);
  const { data } = ctx.getImageData(0, 0, 4, 4);

  // Pixel indices in row-major 4×4 RGBA buffer (4 bytes per pixel).
  // Corners: (0,0)=0, (3,0)=12, (0,3)=48, (3,3)=60.
  const corners = [0, 12, 48, 60];
  let r = 0;
  let g = 0;
  let b = 0;
  for (const idx of corners) {
    r += data[idx];
    g += data[idx + 1];
    b += data[idx + 2];
  }
  r = Math.round(r / 4);
  g = Math.round(g / 4);
  b = Math.round(b / 4);

  const hex = (n: number) => n.toString(16).padStart(2, '0');
  return `#${hex(r)}${hex(g)}${hex(b)}`;
}

/**
 * Load a cover image from a URL and return a ready-to-bind texture
 * plus the extracted metadata. Rejects if the image fails to load
 * or if the canvas becomes tainted (CORS misconfigured on bucket).
 */
export function loadCoverFromUrl(url: string): Promise<CoverPipelineResult> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    // Required so getImageData doesn't throw SecurityError on a tainted canvas.
    // Supabase public buckets serve the necessary CORS headers by default.
    img.crossOrigin = 'anonymous';

    img.onload = () => {
      try {
        const dominantColor = extractDominantColor(img);
        const coverAspect = img.naturalWidth / img.naturalHeight;

        const texture = new THREE.Texture(img);
        texture.colorSpace = THREE.SRGBColorSpace;
        texture.needsUpdate = true;
        // No anisotropy set here — shader reads texels directly and
        // the book face is near-planar in the spine-on camera, so the
        // default filtering is fine.

        resolve({ texture, dominantColor, coverAspect });
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