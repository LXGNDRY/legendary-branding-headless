import {defineConfig} from 'vitest/config';
import path from 'node:path';

export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
    include: ['app/**/*.test.{ts,tsx}', 'app/__tests__/**/*.{ts,tsx}'],
    css: false,
  },
  resolve: {
    alias: {
      '~': path.resolve(__dirname, './app'),
    },
  },
});
