import * as THREE from 'three';

let cached: THREE.DataTexture | null = null;

/**
 * Procedural paper-grain normal map.
 *
 * Strategy: instead of a smooth sine wave, we explicitly carve one
 * V-shaped groove per row cluster. Each groove is 4 pixels tall:
 *   row 0 → slight down
 *   row 1 → deep down (page edge shadow)
 *   row 2 → deep up   (page edge highlight)
 *   row 3 → slight up
 * This makes each "page" visually countable under grazing light, which
 * is exactly the Stripe Press effect — not a smooth ripple.
 */
export function getPaperNormalTexture(): THREE.DataTexture {
  if (cached) return cached;
  const W = 4;
  const H = 256;
  const GROOVE_HEIGHT = 4; // pixels per page
  const data = new Uint8Array(W * H * 4);

  for (let y = 0; y < H; y++) {
    const phase = y % GROOVE_HEIGHT;
    let ny = 0;
    if (phase === 0) ny = -0.3;
    else if (phase === 1) ny = -0.9;
    else if (phase === 2) ny =  0.9;
    else if (phase === 3) ny =  0.3;

    // Per-row jitter so grooves don't feel mechanically uniform
    ny += (Math.random() - 0.5) * 0.15;
    ny = Math.max(-1, Math.min(1, ny));

    const g = Math.round((ny * 0.5 + 0.5) * 255);
    for (let x = 0; x < W; x++) {
      const i = (y * W + x) * 4;
      data[i] = 128;     // nx ~ 0
      data[i + 1] = g;   // ny from groove profile
      data[i + 2] = 255; // nz ~ 1
      data[i + 3] = 255;
    }
  }

  const tex = new THREE.DataTexture(data, W, H, THREE.RGBAFormat);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(1, 25);
  tex.minFilter = THREE.LinearMipMapLinearFilter;
  tex.magFilter = THREE.LinearFilter;
  tex.anisotropy = 8;
  tex.generateMipmaps = true;
  tex.needsUpdate = true;
  cached = tex;
  return tex;
}