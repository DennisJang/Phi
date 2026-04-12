/**
 * Spine texture generator (Step 5a, v4 — language-aware typography)
 *
 * Pure render function: { title, author, coverBaseColor, language }
 *   → deterministic PNG Buffer
 *
 * v4 changes (CJK readability pass):
 *   A. Title/Author sizes split by language. CJK glyphs suffer more
 *      under downsampling than Latin because Hangul composes 2-3
 *      elements per syllable; each element gets fewer pixels.
 *      ko title 32px, en title 22px.
 *   C. Saturation reduction softened from ×0.5 to ×0.7 for stronger
 *      color contrast between foreground and background. Stripe Press
 *      "Hamming" style: spine hue preserved, but foreground stays
 *      chromatic rather than desaturating to near-neutral.
 *   D. Title weight 500 (en) / 600 (ko). Heavier strokes survive
 *      texture downsampling on CJK glyphs better than thin strokes.
 *   +. Author positioned 20px from end (2× Logo margin) rather than
 *      10px, per owner's explicit preference.
 *
 * Determinism contract unchanged.
 */

import { createCanvas, GlobalFonts, type SKRSContext2D } from '@napi-rs/canvas';
import { join } from 'node:path';
import { PHI } from '@/lib/phi/ratios';

// ── Types ───────────────────────────────────────────────────────────────────

export type SpineLanguage = 'ko' | 'en';

export interface SpineInput {
  readonly title: string;
  readonly author: string;
  readonly coverBaseColor: string;
  readonly language: SpineLanguage;
}

export type SpineRenderError =
  | { kind: 'invalid_input'; message: string }
  | { kind: 'font_load_failed'; message: string }
  | { kind: 'canvas_render_failed'; message: string };

export type SpineRenderResult =
  | { ok: true; png: Buffer; width: number; height: number }
  | { ok: false; error: SpineRenderError };

// ── Texture dimensions ──────────────────────────────────────────────────────

const TEXTURE_WIDTH = 128;
const TEXTURE_HEIGHT = 832;

// ── Region split (long axis) ────────────────────────────────────────────────

const TITLE_REGION_RATIO = 1 / PHI; // 0.618
const END_REGION_RATIO = (1 - TITLE_REGION_RATIO) / 2; // 0.191

// ── Typography (language-aware) ─────────────────────────────────────────────

/**
 * Language-keyed sizing. Rationale:
 * - CJK needs larger glyph pixels because Hangul syllables compose
 *   2-3 jamo; each jamo gets 1/2 or 1/3 of the glyph's pixel budget.
 * - Latin glyphs are monolithic and survive downsampling better.
 */
const TITLE_FONT_SIZE: Record<SpineLanguage, number> = { ko: 32, en: 22 };
const AUTHOR_FONT_SIZE: Record<SpineLanguage, number> = { ko: 16, en: 14 };
const LOGO_FONT_SIZE = 72;

const TITLE_WEIGHT: Record<SpineLanguage, number> = { ko: 600, en: 500 };
const AUTHOR_WEIGHT = 400;
const LOGO_WEIGHT = 300;

/** Logo/Title inner padding from spine ends. */
const EDGE_PADDING = 10;
/** Author inner padding — 2× Logo padding per owner preference. */
const AUTHOR_EDGE_PADDING = EDGE_PADDING * 2;

const FONT_SERIF = 'PhiSerif';
const FONT_SANS = 'PhiSans';

let fontsRegistered = false;

// ── Font registration ───────────────────────────────────────────────────────

function registerFonts(): { ok: true } | { ok: false; error: SpineRenderError } {
  if (fontsRegistered) return { ok: true };
  try {
    const fontDir = join(process.cwd(), 'assets', 'fonts');
    GlobalFonts.registerFromPath(join(fontDir, 'NotoSerifKR-VF.ttf'), FONT_SERIF);
    GlobalFonts.registerFromPath(join(fontDir, 'NotoSansKR-VF.ttf'), FONT_SANS);
    fontsRegistered = true;
    return { ok: true };
  } catch (e) {
    return {
      ok: false,
      error: {
        kind: 'font_load_failed',
        message: e instanceof Error ? e.message : 'unknown font load error',
      },
    };
  }
}

// ── Color math ──────────────────────────────────────────────────────────────

interface HSL { h: number; s: number; l: number }

function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const m = /^#([0-9a-fA-F]{6})$/.exec(hex.trim());
  if (!m) return null;
  const n = parseInt(m[1], 16);
  return { r: (n >> 16) & 0xff, g: (n >> 8) & 0xff, b: n & 0xff };
}

function rgbToHsl(r: number, g: number, b: number): HSL {
  const rn = r / 255, gn = g / 255, bn = b / 255;
  const max = Math.max(rn, gn, bn);
  const min = Math.min(rn, gn, bn);
  const l = (max + min) / 2;
  let h = 0, s = 0;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case rn: h = ((gn - bn) / d + (gn < bn ? 6 : 0)) * 60; break;
      case gn: h = ((bn - rn) / d + 2) * 60; break;
      default: h = ((rn - gn) / d + 4) * 60;
    }
  }
  return { h, s, l };
}

function hslToCss({ h, s, l }: HSL): string {
  return `hsl(${h.toFixed(2)}, ${(s * 100).toFixed(2)}%, ${(l * 100).toFixed(2)}%)`;
}

function clamp(v: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, v));
}

interface SpinePalette {
  background: string;
  foreground: string;
}

/**
 * Color rule:
 *   Background: cover hue preserved, sat preserved, lightness ×0.88
 *   Foreground: cover hue preserved, sat ×0.7 (was 0.5), lightness
 *               reflected across 0.5 with bounded amplitude.
 *
 * Sat ×0.7 keeps foreground chromatic enough to read as an intentional
 * color rather than "washed-out version of background". Stripe Press
 * Hamming spine: olive bg + saturated gold fg — the gold stays gold,
 * not desaturated yellow-brown.
 */
function derivePalette(coverBaseColor: string): SpinePalette | null {
  const rgb = hexToRgb(coverBaseColor);
  if (!rgb) return null;
  const base = rgbToHsl(rgb.r, rgb.g, rgb.b);

  const bgHsl: HSL = {
    h: base.h,
    s: base.s,
    l: clamp(base.l * 0.88, 0.05, 0.95),
  };

  const fgL =
    bgHsl.l < 0.5
      ? clamp(bgHsl.l + 0.55, 0.78, 0.92)
      : clamp(bgHsl.l - 0.55, 0.08, 0.22);
  const fgHsl: HSL = {
    h: base.h,
    s: base.s * 0.7,
    l: fgL,
  };

  return {
    background: hslToCss(bgHsl),
    foreground: hslToCss(fgHsl),
  };
}

// ── Text fitting ────────────────────────────────────────────────────────────

function fitText(ctx: SKRSContext2D, text: string, maxPx: number): string {
  if (ctx.measureText(text).width <= maxPx) return text;
  const chars = Array.from(text);
  for (let i = chars.length - 1; i > 0; i--) {
    const candidate = chars.slice(0, i).join('').trimEnd() + '…';
    if (ctx.measureText(candidate).width <= maxPx) return candidate;
  }
  return '…';
}

/**
 * Draw text with visual centroid at (x, cy), compensating for CJK font
 * metrics where em-box middle sits above glyph visual middle.
 */
function fillTextCentered(
  ctx: SKRSContext2D,
  text: string,
  x: number,
  cy: number,
): void {
  const prevBaseline = ctx.textBaseline;
  ctx.textBaseline = 'alphabetic';
  const m = ctx.measureText(text);
  const ascent = m.actualBoundingBoxAscent;
  const descent = m.actualBoundingBoxDescent;
  const baselineY = cy + (ascent - descent) / 2;
  ctx.fillText(text, x, baselineY);
  ctx.textBaseline = prevBaseline;
}

// ── Input normalization ─────────────────────────────────────────────────────

function normalizeInput(input: SpineInput): SpineInput | null {
  const title = input.title.normalize('NFC').trim();
  const author = input.author.normalize('NFC').trim();
  if (!title || !author) return null;
  if (title.length > 200 || author.length > 200) return null;
  if (!/^#[0-9a-fA-F]{6}$/.test(input.coverBaseColor)) return null;
  if (input.language !== 'ko' && input.language !== 'en') return null;
  return {
    title,
    author,
    coverBaseColor: input.coverBaseColor,
    language: input.language,
  };
}

// ── Main render ─────────────────────────────────────────────────────────────

export function renderSpine(input: SpineInput): SpineRenderResult {
  const normalized = normalizeInput(input);
  if (!normalized) {
    return {
      ok: false,
      error: { kind: 'invalid_input', message: 'title/author/color/language validation failed' },
    };
  }

  const fontResult = registerFonts();
  if (!fontResult.ok) return fontResult;

  const palette = derivePalette(normalized.coverBaseColor);
  if (!palette) {
    return {
      ok: false,
      error: { kind: 'invalid_input', message: 'coverBaseColor could not be parsed' },
    };
  }

  const lang = normalized.language;
  const titleSize = TITLE_FONT_SIZE[lang];
  const titleWeight = TITLE_WEIGHT[lang];
  const authorSize = AUTHOR_FONT_SIZE[lang];

  try {
    const canvas = createCanvas(TEXTURE_WIDTH, TEXTURE_HEIGHT);
    const ctx = canvas.getContext('2d');

    // 1. Background fill
    ctx.fillStyle = palette.background;
    ctx.fillRect(0, 0, TEXTURE_WIDTH, TEXTURE_HEIGHT);

    // 2. Rotate for horizontal text layout.
    ctx.save();
    if (lang === 'ko') {
      ctx.translate(0, TEXTURE_HEIGHT);
      ctx.rotate(-Math.PI / 2);
    } else {
      ctx.translate(TEXTURE_WIDTH, 0);
      ctx.rotate(Math.PI / 2);
    }

    const surfaceW = TEXTURE_HEIGHT;
    const surfaceH = TEXTURE_WIDTH;
    const centerY = surfaceH / 2;

    const topEndX = surfaceW * END_REGION_RATIO;
    const bottomStartX = surfaceW * (1 - END_REGION_RATIO);
    const titleMaxWidth = (bottomStartX - topEndX) - EDGE_PADDING * 2;
    // Author's max width shrinks by the extra 10px inset.
    const authorMaxWidth = topEndX - AUTHOR_EDGE_PADDING - EDGE_PADDING;

    ctx.fillStyle = palette.foreground;

    // 3. Title — serif, language-aware size + weight, centered.
    ctx.font = `${titleWeight} ${titleSize}px ${FONT_SERIF}`;
    ctx.textAlign = 'center';
    const titleFitted = fitText(ctx, normalized.title, titleMaxWidth);
    fillTextCentered(ctx, titleFitted, surfaceW / 2, centerY);

    // 4. Author — sans, language-aware size, inset 2× from end.
    ctx.font = `${AUTHOR_WEIGHT} ${authorSize}px ${FONT_SANS}`;
    const authorFitted = fitText(ctx, normalized.author, authorMaxWidth);
    if (lang === 'ko') {
      ctx.textAlign = 'left';
      fillTextCentered(ctx, authorFitted, AUTHOR_EDGE_PADDING, centerY);
    } else {
      ctx.textAlign = 'right';
      fillTextCentered(ctx, authorFitted, surfaceW - AUTHOR_EDGE_PADDING, centerY);
    }

    // 5. Logo Φ — serif, light weight, at foot end.
    ctx.font = `${LOGO_WEIGHT} ${LOGO_FONT_SIZE}px ${FONT_SERIF}`;
    if (lang === 'ko') {
      ctx.textAlign = 'right';
      fillTextCentered(ctx, 'Φ', surfaceW - EDGE_PADDING, centerY);
    } else {
      ctx.textAlign = 'left';
      fillTextCentered(ctx, 'Φ', EDGE_PADDING, centerY);
    }

    ctx.restore();

    const png = canvas.toBuffer('image/png');
    return { ok: true, png, width: TEXTURE_WIDTH, height: TEXTURE_HEIGHT };
  } catch (e) {
    return {
      ok: false,
      error: {
        kind: 'canvas_render_failed',
        message: e instanceof Error ? e.message : 'unknown canvas error',
      },
    };
  }
}