import sharp from 'sharp';

/**
 * Image processing pipeline for cover textures.
 *
 * Responsibilities:
 *   1. Decode input buffer via sharp
 *   2. Extract width + height metadata
 *   3. Compute a "dominant" background color by averaging the four
 *      corner pixels of the image
 *   4. Convert to WebP quality 85 for Storage
 *
 * Why the four-corners average for dominant color:
 *
 *   Book covers overwhelmingly follow a consistent pattern: the
 *   background color extends to all edges, while the title and
 *   imagery concentrate in the center. Sampling the four corners and
 *   averaging them gives us a reliable signal of the cover's
 *   background color — which is exactly what the letterbox compositor
 *   (Step 4e) needs to make the cover melt into the book surface.
 *
 *   We previously used colorthief for MMCQ-based dominant color
 *   extraction, but hit runtime issues with Buffer inputs in
 *   colorthief@2.7. Corner sampling is:
 *     - Deterministic and simple (no external algorithm surprises)
 *     - Accurate enough for letterbox integration
 *     - Zero additional dependencies beyond sharp (which we already
 *       need for WebP conversion)
 *
 *   If Step 4e's visual tests show the result is too naive, we can
 *   upgrade to a more sophisticated approach later. For now,
 *   simplicity wins.
 *
 * Why WebP, quality 85:
 *   - iPad Safari has native WebP since iOS 14
 *   - Quality 85 yields ~3-5x size reduction vs JPEG with no
 *     perceptible loss at cover-on-3D-surface viewing distance
 *   - Single codec means one render path on the client
 */

export interface ProcessedImage {
  webpBuffer: Buffer;
  dominantColor: string; // "#RRGGBB"
  width: number;
  height: number;
}

export type ProcessImageError =
  | { kind: 'decode_failed'; message: string }
  | { kind: 'metadata_missing'; message: string }
  | { kind: 'color_extraction_failed'; message: string }
  | { kind: 'encode_failed'; message: string };

export type ProcessImageResult =
  | { ok: true; data: ProcessedImage }
  | { ok: false; error: ProcessImageError };

export async function processImage(
  inputBuffer: Buffer
): Promise<ProcessImageResult> {
  // Step 1: Decode + metadata via sharp
  let metadata: sharp.Metadata;
  try {
    metadata = await sharp(inputBuffer).metadata();
  } catch (err) {
    return {
      ok: false,
      error: {
        kind: 'decode_failed',
        message: err instanceof Error ? err.message : String(err),
      },
    };
  }

  const { width, height } = metadata;
  if (!width || !height) {
    return {
      ok: false,
      error: {
        kind: 'metadata_missing',
        message: 'sharp could not determine width/height',
      },
    };
  }

  // Step 2: Extract dominant color via four-corner sampling.
  //
  // We resize the image to a tiny grid (4x4 -> 16 pixels) and sample
  // the four corners. A 4x4 resize gives sharp enough room to produce
  // meaningful corner averages without being influenced by a single
  // stray pixel. Then we average the four RGB values.
  let dominantColor: string;
  try {
    const { data, info } = await sharp(inputBuffer)
      .resize(4, 4, { fit: 'fill' })
      .removeAlpha()
      .raw()
      .toBuffer({ resolveWithObject: true });

    // data is a flat Buffer of RGB bytes: [r0,g0,b0, r1,g1,b1, ...]
    // In a 4x4 grid, the four corners are at positions:
    //   top-left:     (0, 0) -> index 0
    //   top-right:    (3, 0) -> index 3
    //   bottom-left:  (0, 3) -> index 12
    //   bottom-right: (3, 3) -> index 15
    // Each pixel is 3 bytes (R, G, B), so byte offset = pixelIndex * 3.
    const channels = info.channels; // should be 3 after removeAlpha
    if (channels !== 3) {
      throw new Error(`Expected 3 channels after removeAlpha, got ${channels}`);
    }

    const cornerPixelIndices = [0, 3, 12, 15];
    let rSum = 0;
    let gSum = 0;
    let bSum = 0;
    for (const pixelIndex of cornerPixelIndices) {
      const byteOffset = pixelIndex * channels;
      rSum += data[byteOffset];
      gSum += data[byteOffset + 1];
      bSum += data[byteOffset + 2];
    }
    const r = Math.round(rSum / cornerPixelIndices.length);
    const g = Math.round(gSum / cornerPixelIndices.length);
    const b = Math.round(bSum / cornerPixelIndices.length);
    dominantColor = rgbToHex(r, g, b);
  } catch (err) {
    return {
      ok: false,
      error: {
        kind: 'color_extraction_failed',
        message: err instanceof Error ? err.message : String(err),
      },
    };
  }

  // Step 3: Convert to WebP for Storage.
  //
  // We build a fresh sharp instance because the one used for corner
  // sampling has already been consumed (each sharp pipeline supports
  // one terminal call).
  let webpBuffer: Buffer;
  try {
    webpBuffer = await sharp(inputBuffer).webp({ quality: 85 }).toBuffer();
  } catch (err) {
    return {
      ok: false,
      error: {
        kind: 'encode_failed',
        message: err instanceof Error ? err.message : String(err),
      },
    };
  }

  return {
    ok: true,
    data: {
      webpBuffer,
      dominantColor,
      width,
      height,
    },
  };
}

function rgbToHex(r: number, g: number, b: number): string {
  const clamp = (v: number) => Math.max(0, Math.min(255, Math.round(v)));
  const toHex = (v: number) => clamp(v).toString(16).padStart(2, '0');
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}