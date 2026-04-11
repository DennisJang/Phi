import * as THREE from 'three';

export interface CoverSample {
  texture: THREE.Texture;
  aspect: number;
  coverBaseColor: THREE.Color;
  dominantHex: string;
}

const G = 8;
interface RGB { r: number; g: number; b: number }

function sampleEdges(img: HTMLImageElement): RGB {
  const c = document.createElement('canvas');
  c.width = G; c.height = G;
  const ctx = c.getContext('2d', { willReadFrequently: true });
  if (!ctx) return { r: 0, g: 0, b: 0 };
  ctx.drawImage(img, 0, 0, G, G);
  const { data } = ctx.getImageData(0, 0, G, G);
  let r = 0, g = 0, b = 0, n = 0;
  for (let y = 0; y < G; y++) {
    for (let x = 0; x < G; x++) {
      // edge = outside central 4x4 (indices 2..5)
      if (x >= 2 && x <= 5 && y >= 2 && y <= 5) continue;
      const i = (y * G + x) * 4;
      r += data[i]; g += data[i + 1]; b += data[i + 2]; n++;
    }
  }
  return { r: Math.round(r / n), g: Math.round(g / n), b: Math.round(b / n) };
}

const toColor = ({ r, g, b }: RGB) => new THREE.Color(r / 255, g / 255, b / 255);
const toHex = ({ r, g, b }: RGB) =>
  `#${[r, g, b].map(n => n.toString(16).padStart(2, '0')).join('')}`;

export function loadCoverFromUrl(url: string): Promise<CoverSample> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      try {
        const rgb = sampleEdges(img);
        const texture = new THREE.Texture(img);
        texture.colorSpace = THREE.SRGBColorSpace;
        texture.anisotropy = 8;
        texture.needsUpdate = true;
        resolve({
          texture,
          aspect: img.naturalWidth / img.naturalHeight,
          coverBaseColor: toColor(rgb),
          dominantHex: toHex(rgb),
        });
      } catch (e) {
        reject(e instanceof Error ? e : new Error(String(e)));
      }
    };
    img.onerror = () => reject(new Error(`Failed to load cover: ${url}`));
    img.src = url;
  });
}