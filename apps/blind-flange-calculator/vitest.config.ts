import {defineConfig} from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/**/*.{test,spec}.{ts,tsx}'],
    environmentMatchGlobs: [['src/**/*.test.tsx', 'jsdom']],
    setupFiles: ['src/__tests__/setup.ts'],
    // Prefer projects later; matchGlobs still works for this split.
    globals: false,
  },
});
