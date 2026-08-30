import {defineConfig} from 'vite';
import {hydrogen} from '@shopify/hydrogen/vite';
import {oxygen} from '@shopify/mini-oxygen/vite';
import {reactRouter} from '@react-router/dev/vite';
import tailwindcss from '@tailwindcss/vite';
import tsconfigPaths from 'vite-tsconfig-paths';

export default defineConfig({
  // Vite's default envPrefix is 'VITE_' only. root.tsx's client-side
  // analytics/monitoring config is now threaded through the root loader
  // from context.env (the Oxygen worker's runtime environment) rather than
  // read via import.meta.env.PUBLIC_* -- that's required for values that
  // are only ever set as Oxygen runtime env vars, since import.meta.env is
  // resolved at Vite build time. 'PUBLIC_' is kept here too so any
  // genuinely build-time PUBLIC_ value (set in a local .env for `vite
  // build`) is still exposed, but it is not what makes the Oxygen-deployed
  // analytics IDs work -- the loader threading is.
  envPrefix: ['VITE_', 'PUBLIC_'],
  plugins: [
    tailwindcss(),
    hydrogen(),
    oxygen(),
    reactRouter(),
    tsconfigPaths(),
  ],
  build: {
    assetsInlineLimit: 0,
  },
  ssr: {
    optimizeDeps: {
      include: ['react-router', 'set-cookie-parser', 'cookie'],
    },
  },
  server: {
    allowedHosts: ['.tryhydrogen.dev'],
  },
});
