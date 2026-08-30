import {defineConfig} from 'vite';
import {hydrogen} from '@shopify/hydrogen/vite';
import {oxygen} from '@shopify/mini-oxygen/vite';
import {reactRouter} from '@react-router/dev/vite';
import tailwindcss from '@tailwindcss/vite';
import tsconfigPaths from 'vite-tsconfig-paths';

export default defineConfig({
  // Vite's default envPrefix is 'VITE_' only. Every client-side analytics/
  // monitoring env var in this app (PUBLIC_SENTRY_DSN, PUBLIC_GA4_
  // MEASUREMENT_ID, PUBLIC_META_PIXEL_ID, PUBLIC_TIKTOK_PIXEL_ID,
  // PUBLIC_KLAVIYO_COMPANY_ID) is read via `import.meta.env.PUBLIC_*` in
  // root.tsx, so without 'PUBLIC_' also allowed here, every one of those
  // values is silently undefined at build time regardless of what's
  // configured in .env or Oxygen's environment variables -- none of that
  // client-side tracking has ever actually initialized.
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
