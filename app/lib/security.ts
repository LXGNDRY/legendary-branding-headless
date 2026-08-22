/**
 * Security response headers for Legendary Branding Headless
 *
 * Applied to every response via root loader's loader headers.
 * CSP is non-strict by default (unsafe-inline for styles/scripts is needed
 * for React Router + Tailwind + inline script preloading).
 * Tighten as needed once third-party scripts are catalogued.
 */

export const SECURITY_HEADERS: Record<string, string> = {
  // CSP — moderate strictness; allow inline styles (Tailwind) and
  // allow necessary third-party origins.
  'Content-Security-Policy': [
    "default-src 'self'",
    // Scripts: self + Shopify CDN + inline hydration + consent-gated analytics
    // unsafe-inline: needed for React hydration + inline script preloading
    // unsafe-eval removed: not needed by Hydrogen / React Router / Tailwind
    "script-src 'self' 'unsafe-inline' cdn.shopify.com shop.app *.shopifypay.com www.googletagmanager.com connect.facebook.net analytics.tiktok.com static.klaviyo.com *.klaviyo.com cdn.judge.me",
    // Styles: inline needed for Tailwind + inline styles
    "style-src 'self' 'unsafe-inline' fonts.googleapis.com cdn.shopify.com *.klaviyo.com",
    // Fonts: Google Fonts
    "font-src 'self' fonts.gstatic.com fonts.googleapis.com cdn.shopify.com",
    // Images: product CDNs + analytics pixel beacons + review/form assets
    "img-src 'self' data: blob: *.shopify.com cdn.shopify.com www.facebook.com www.google-analytics.com *.klaviyo.com cdn.judge.me judgeme-review-images-cdn.judge.me",
    // Media
    "media-src 'self' data: blob: *.shopify.com",
    // Iframe: Shopify checkout, shop pay, Klaviyo onsite forms
    "frame-src 'self' *.shopify.com shop.app *.shopifypay.com *.klaviyo.com",
    // Connect: API calls, analytics beacons, Sentry, WebSocket for HMR in dev
    "connect-src 'self' *.shopify.com cdn.shopify.com wss: ws: www.google-analytics.com analytics.google.com www.googletagmanager.com graph.facebook.com analytics.tiktok.com *.sentry.io *.klaviyo.com static.klaviyo.com cdn.judge.me api.judge.me judge.me",
    // Form actions
    "form-action 'self' *.shopify.com",
    // Base URI
    "base-uri 'self'",
    // Object types (block Flash, etc.)
    "object-src 'none'",
    // Upgrade to HTTPS
    'upgrade-insecure-requests',
  ].join('; '),

  // Clickjacking protection
  'X-Frame-Options': 'DENY',

  // MIME type sniffing protection
  'X-Content-Type-Options': 'nosniff',

  // Referrer policy
  'Referrer-Policy': 'strict-origin-when-cross-origin',

  // HSTS (one year, include subdomains, preload)
  // Note: only apply on the production domain
  'Strict-Transport-Security':
    'max-age=31536000; includeSubDomains; preload',

  // Permissions policy — disable unused APIs
  'Permissions-Policy':
    'camera=(), microphone=(), geolocation=(), payment=(), usb=(), bluetooth=()',

  // Cross-Origin
  'Cross-Origin-Opener-Policy': 'same-origin-allow-popups',
  'Cross-Origin-Resource-Policy': 'cross-origin',
  'Cross-Origin-Embedder-Policy': 'unsafe-none',
};

/**
 * Apply security headers to a Response.
 * Returns a new Response with headers added (non-mutating).
 */
export function applySecurityHeaders(
  response: Response,
  request?: Request,
): Response {
  const newResponse = new Response(response.body, response);
  const isHttps = !request || new URL(request.url).protocol === 'https:';

  for (const [name, value] of Object.entries(SECURITY_HEADERS)) {
    if (!isHttps && name === 'Strict-Transport-Security') continue;
    // Don't overwrite existing headers of the same name
    if (!newResponse.headers.has(name)) {
      newResponse.headers.set(
        name,
        !isHttps && name === 'Content-Security-Policy'
          ? value.replace(/; upgrade-insecure-requests$/, '')
          : value,
      );
    }
  }

  return newResponse;
}

/**
 * Check if a request is for a static asset (not a document/API call).
 * Used to skip heavy security headers on asset responses.
 */
export function isAssetRequest(request: Request): boolean {
  const url = new URL(request.url);
  const staticExtensions = /\.(css|js|woff2?|ttf|otf|eot|png|jpg|jpeg|gif|svg|webp|avif|ico|mp4|webm|mp3|wav|pdf)$/i;
  return staticExtensions.test(url.pathname);
}
