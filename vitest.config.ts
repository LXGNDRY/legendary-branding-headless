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
      // NOTE: floors sit just under the measured baseline (2026-10-23: 81.1/68.5/73.9/82.4) and only ratchet up.
      thresholds: {statements: 79, branches: 66, functions: 71, lines: 80},
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
