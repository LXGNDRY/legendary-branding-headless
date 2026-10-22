/**
 * site.webmanifest — resource route.
 *
 * Served from a route rather than the static file in public/site.webmanifest
 * because Shopify Oxygen's edge asset layer doesn't recognize the
 * .webmanifest extension -- requests for it fell through to this app's
 * worker, which then rendered a normal 404 page for the unmatched path.
 * Same fix pattern as [robots.txt].ts/[sitemap.xml].tsx: a route with an
 * explicit Content-Type guarantees it's served correctly regardless of the
 * CDN layer's static-extension allowlist.
 */
const MANIFEST = {
  name: 'Legendary Branding',
  short_name: 'Legendary',
  description: 'Premium editorial streetwear — crafted with intention, built to last.',
  start_url: '/',
  display: 'standalone',
  // NOTE: matches the dark Onyx canvas and the <meta name="theme-color"> in root.tsx.
  background_color: '#0A0A0A',
  theme_color: '#0A0A0A',
  icons: [
    {src: '/icon-192.png', sizes: '192x192', type: 'image/png'},
    {src: '/icon-512.png', sizes: '512x512', type: 'image/png'},
  ],
} as const;

export async function loader() {
  return new Response(JSON.stringify(MANIFEST), {
    headers: {
      'Content-Type': 'application/manifest+json',
      'Cache-Control': 'public, max-age=86400, stale-while-revalidate=604800',
    },
  });
}
