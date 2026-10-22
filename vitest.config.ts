import {defineConfig} from 'vitest/config';
import path from 'node:path';

export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
    include: [
      'app/**/*.test.{ts,tsx}',
      'app/__tests__/**/*.{ts,tsx}',
      'scripts/**/*.test.mjs',
    ],
    css: false,
    setupFiles: ['app/test/setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text-summary', 'json-summary', 'lcov'],
      reportsDirectory: 'coverage',
      include: ['app/**/*.{ts,tsx}', 'server.ts'],
      // NOTE: floors sit just under the measured baseline (2026-10-22: 73.9/58.5/62.7/74.7) and only ratchet up.
      thresholds: {statements: 72, branches: 56, functions: 60, lines: 72},
      exclude: [
        'app/**/*.test.{ts,tsx}',
        'app/__tests__/**',
        'app/test/**',
        '**/*.d.ts',
        '**/*.generated.*',
      ],
    },
  },
  resolve: {
    alias: {
      '~': path.resolve(import.meta.dirname, './app'),
    },
  },
});
