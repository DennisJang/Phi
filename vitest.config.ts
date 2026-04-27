import { defineConfig } from 'vitest/config';
import { fileURLToPath } from 'node:url';

/**
 * Vitest config — Phi 2.0 Stage 1 test infra.
 *
 * Tests live alongside the modules they exercise as `*.test.ts`.
 * Node environment is the default; UI/component tests will gain
 * jsdom in a later phase if/when that surface needs unit coverage.
 *
 * The `@/` alias mirrors tsconfig.json so test imports match
 * production code style.
 */
export default defineConfig({
  test: {
    environment: 'node',
    include: ['lib/**/*.test.ts', 'app/**/*.test.ts', 'components/**/*.test.ts'],
    exclude: ['**/node_modules/**', '**/.next/**'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov'],
    },
  },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./', import.meta.url)),
    },
  },
});
