import type { Config } from 'tailwindcss';
import { PHI_DARK } from './lib/phi/colors';
import { DURATION_MS, PHI_EASING } from './lib/phi/ratios';
import { SPACING_PX } from './lib/phi/spacing';

/**
 * Tailwind config — Phi System binding layer.
 *
 * This file imports directly from lib/phi/ modules. It must not introduce
 * any color, duration, or spacing value that isn't already defined there.
 *
 * Token name convention: kebab-case in Tailwind, camelCase in lib/phi/.
 * Example: `bg-canvas` (Tailwind) ↔ `bgCanvas` (lib/phi/colors.ts).
 */

const config: Config = {
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        // Background scale (PROJECT_KNOWLEDGE.md §3.5)
        canvas: PHI_DARK.bgCanvas,
        surface: PHI_DARK.bgSurface,
        elevated: PHI_DARK.bgElevated,
        overlay: PHI_DARK.bgOverlay,

        // Text scale
        'text-primary': PHI_DARK.textPrimary,
        'text-secondary': PHI_DARK.textSecondary,
        'text-tertiary': PHI_DARK.textTertiary,

        // Warm accents
        'accent-gold': PHI_DARK.accentGold,
        'accent-cream': PHI_DARK.accentCream,
        'accent-ink': PHI_DARK.accentInk,

        // Interactive (cool, reserved for action)
        'interactive-primary': PHI_DARK.interactivePrimary,
        'interactive-hover': PHI_DARK.interactiveHover,
      },
      fontFamily: {
        serif: ['Cormorant Garamond', 'Noto Serif KR', 'serif'],
        sans: ['Inter', 'Pretendard', 'sans-serif'],
      },
      spacing: {
        'phi-tight': `${SPACING_PX.tight}px`,
        'phi-regular': `${SPACING_PX.regular}px`,
        'phi-loose': `${SPACING_PX.loose}px`,
      },
      borderRadius: {
        sm: '4px',
        md: '8px',
        lg: '16px',
      },
      transitionTimingFunction: {
        phi: PHI_EASING,
      },
      transitionDuration: {
        'phi-fast': `${DURATION_MS.FAST}ms`,
        'phi-default': `${DURATION_MS.DEFAULT}ms`,
        'phi-slow': `${DURATION_MS.SLOW}ms`,
      },
    },
  },
  plugins: [],
};

export default config;