import { createCanvas, GlobalFonts, type SKRSContext2D } from '@napi-rs/canvas';
import { createHash } from 'node:crypto';
import path from 'node:path';

// PHI constants (mirrors lib/phi/ratios.ts to keep this module standalone)
const PHI = 1.6180339887;
const PHI_INV = 0.6180339887;
const PHI_INV_CUBE = 0.2360679775;

const CANVAS_SIZE = 1024;
const SAFE_MARGIN = Math.round(CANVAS_SIZE * PHI_INV_CUBE); // ~242px
const TITLE_Y_RATIO = 1 - PHI_INV; // 0.382 from top (golden section)

// Font registration: module-level singleton, runs exactly once per process.
let fontsRegistered = false;
function ensureFontsRegistered(): void {
  if (fontsRegistered) return;
  const fontDir = path.join(process.cwd(), 'assets', 'fonts');
  GlobalFonts.registerFromPath(path.join(fontDir, 'NotoSerifKR-VF.ttf'), 'NotoSerifKR');
  GlobalFonts.registerFromPath(path.join(fontDir, 'NotoSansKR-VF.ttf'), 'NotoSansKR');
  fontsRegistered = true;
}

export interface TypographicCoverInput {
  title: string;
  author: string;
  language: 'ko' | 'en';
}

export interface TypographicCoverResult {
  buffer: Buffer;
  seedColor: string; // hex, for caller logging / debugging
}

/**
 * Deterministic seed color: hash(title|author) → HSL.
 * Hue across full circle, saturation 35-50%, lightness 18-28% (warm dark Stripe Press tone).
 */
function deriveSeedColor(title: string, author: string): { h: number; s: number; l: number; hex: string } {
  const hash = createHash('sha1').update(`${title}|${author}`).digest();
  const h = (hash[0] / 255) * 360;
  const s = 35 + (hash[1] / 255) * 15;
  const l = 18 + (hash[2] / 255) * 10;
  const hex = hslToHex(h, s, l);
  return { h, s, l, hex };
}

function hslToHex(h: number, s: number, l: number): string {
  const sN = s / 100;
  const lN = l / 100;
  const c = (1 - Math.abs(2 * lN - 1)) * sN;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = lN - c / 2;
  let r = 0, g = 0, b = 0;
  if (h < 60) { r = c; g = x; }
  else if (h < 120) { r = x; g = c; }
  else if (h < 180) { g = c; b = x; }
  else if (h < 240) { g = x; b = c; }
  else if (h < 300) { r = x; b = c; }
  else { r = c; b = x; }
  const toHex = (v: number) => Math.round((v + m) * 255).toString(16).padStart(2, '0');
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

/**
 * Word-wrap text to fit max width. Returns array of lines.
 * For Korean (CJK), falls back to character-level wrapping if no spaces.
 */
function wrapText(ctx: SKRSContext2D, text: string, maxWidth: number, maxLines: number): string[] {
  const hasSpaces = /\s/.test(text);
  const tokens = hasSpaces ? text.split(/\s+/) : Array.from(text);
  const joiner = hasSpaces ? ' ' : '';
  const lines: string[] = [];
  let current = '';
  for (const token of tokens) {
    const candidate = current ? `${current}${joiner}${token}` : token;
    if (ctx.measureText(candidate).width <= maxWidth) {
      current = candidate;
    } else {
      if (current) lines.push(current);
      current = token;
      if (lines.length === maxLines - 1) break;
    }
  }
  if (current && lines.length < maxLines) lines.push(current);
  // Truncate last line with ellipsis if input was longer than what we drew
  const drawn = lines.join(joiner);
  if (drawn.length < text.length && lines.length > 0) {
    let last = lines[lines.length - 1];
    while (last.length > 0 && ctx.measureText(`${last}…`).width > maxWidth) {
      last = last.slice(0, -1);
    }
    lines[lines.length - 1] = `${last}…`;
  }
  return lines;
}

export function generateTypographicCover(input: TypographicCoverInput): TypographicCoverResult {
  ensureFontsRegistered();

  const { title, author } = input;
  const seed = deriveSeedColor(title, author);

  const canvas = createCanvas(CANVAS_SIZE, CANVAS_SIZE);
  const ctx = canvas.getContext('2d');

  // Background: solid seed color
  ctx.fillStyle = seed.hex;
  ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);

  // Subtle vignette to add depth (Stripe Press warmth)
  const grad = ctx.createRadialGradient(
    CANVAS_SIZE / 2, CANVAS_SIZE / 2, CANVAS_SIZE * 0.3,
    CANVAS_SIZE / 2, CANVAS_SIZE / 2, CANVAS_SIZE * 0.75,
  );
  grad.addColorStop(0, 'rgba(0,0,0,0)');
  grad.addColorStop(1, 'rgba(0,0,0,0.35)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);

  const safeWidth = CANVAS_SIZE - SAFE_MARGIN * 2;
  const cream = '#F0E6D3'; // accent-cream from §3.5

  // Title: serif, centered, golden-section vertical position
  ctx.fillStyle = cream;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  let titleSize = 96;
  ctx.font = `700 ${titleSize}px NotoSerifKR`;
  let titleLines = wrapText(ctx, title, safeWidth, 3);
  // Shrink if 3 lines would overflow lower zone
  while (titleSize > 48 && titleLines.length === 3 && ctx.measureText(titleLines[0]).width > safeWidth) {
    titleSize -= 8;
    ctx.font = `700 ${titleSize}px NotoSerifKR`;
    titleLines = wrapText(ctx, title, safeWidth, 3);
  }
  const titleLineHeight = titleSize * 1.2;
  const titleStartY = CANVAS_SIZE * TITLE_Y_RATIO;
  titleLines.forEach((line, i) => {
    ctx.fillText(line, CANVAS_SIZE / 2, titleStartY + i * titleLineHeight);
  });

  // Author: sans-serif, centered, lower third
  const authorSize = 36;
  ctx.font = `400 ${authorSize}px NotoSansKR`;
  ctx.fillStyle = 'rgba(240, 230, 211, 0.75)';
  const authorLines = wrapText(ctx, author, safeWidth, 1);
  ctx.fillText(authorLines[0], CANVAS_SIZE / 2, CANVAS_SIZE - SAFE_MARGIN - authorSize);

  // Φ mark: bottom-right
  ctx.font = `400 28px NotoSerifKR`;
  ctx.fillStyle = 'rgba(212, 165, 116, 0.6)'; // accent-gold faded
  ctx.textAlign = 'right';
  ctx.fillText('Φ', CANVAS_SIZE - SAFE_MARGIN / 2, CANVAS_SIZE - SAFE_MARGIN / 2);

  return {
    buffer: canvas.toBuffer('image/png'),
    seedColor: seed.hex,
  };
}