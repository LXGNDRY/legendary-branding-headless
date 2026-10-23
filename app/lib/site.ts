/**
 * Public site contract: the one canonical origin and the stable route, contact and social facts that
 * metadata, structured data, the sitemap and robots.txt all read. Nothing else in app source should spell
 * the live domain.
 *
 * NOTE: deliberately a constant, not an env var. Canonical tags are built in route `meta` functions that have
 * no access to the request environment, and a mistyped variable would silently move every canonical off the
 * live domain. It is separate from PUBLIC_CHECKOUT_DOMAIN, which is where checkout lives, not where pages are indexed.
 */
import {localizePath, toSupportedLanguage} from './locale';

/** Where pages are indexed. Previews and the raw Oxygen URL point their canonicals here and stay noindex. */
export const SITE_ORIGIN = 'https://legendary-branding.com';

export const SUPPORT_EMAIL = 'lb@legendary-branding.com';

/** Real, verified brand profiles only (schema.org `sameAs`, footer links). */
export const SOCIAL_PROFILES = [
  {label: 'Instagram', href: 'https://www.instagram.com/legendary_branding/'},
  {label: 'TikTok', href: 'https://www.tiktok.com/@legendarybranding'},
] as const;

/** Stable route contracts. */
export const ROUTES = {
  home: '/',
  collections: '/collections',
  journal: '/journal',
  search: '/search',
  wishlist: '/wishlist',
  policy: (handle: string) => `/policies/${handle}`,
  page: (handle: string) => `/pages/${handle}`,
  product: (handle: string) => `/products/${handle}`,
  collection: (handle: string) => `/collections/${handle}`,
  article: (handle: string) => `/journal/${handle}`,
} as const;

/**
 * Policy handles served by /policies/:handle (the canonical route for each; /pages/<same handle> redirects there).
 * `legal` handles are Shopify's built-in store policies, which are the authority for their content.
 */
export const POLICY_PAGES = {
  'refund-policy': {title: 'Refund & Return Policy', native: 'refundPolicy', required: true},
  'terms-of-service': {title: 'Terms of Service', native: 'termsOfService', required: true},
  'privacy-with-legendary-branding': {title: 'Privacy Policy', native: 'privacyPolicy', required: true},
  'shipping-policy': {title: 'Shipping Policy', native: 'shippingPolicy', required: true},
  'size-guide': {title: 'Size Guide', native: null, required: true},
  about: {title: 'About Us', native: null, required: true},
  // NOTE: renders its own contact block, so it is served even with no page body.
  contact: {title: 'Contact', native: null, required: false},
  legendary_branding_faqs: {title: 'FAQ', native: null, required: true},
} as const satisfies Record<string, {title: string; native: string | null; required: boolean}>;

export type PolicyHandle = keyof typeof POLICY_PAGES;

export function isPolicyHandle(handle: string): handle is PolicyHandle {
  return Object.prototype.hasOwnProperty.call(POLICY_PAGES, handle);
}

/**
 * Absolute URL on the canonical origin. Accepts a site path ("/products/x") or an absolute https URL
 * (normalized from the public host or its www Online Store alias); anything else (protocol-relative, javascript:, control characters) falls back to the
 * origin root rather than producing a malformed or untrusted URL. The query string and fragment are dropped:
 * canonicals never carry them.
 */
export function absoluteUrl(pathOrUrl: string): string {
  if (typeof pathOrUrl !== 'string' || /[\p{Cc}\s]/u.test(pathOrUrl)) return SITE_ORIGIN;
  if (/^https:\/\//i.test(pathOrUrl)) {
    try {
      const url = new URL(pathOrUrl);
      const publicHost = new URL(SITE_ORIGIN).hostname;
      if (url.username || url.password || url.port || ![publicHost, `www.${publicHost}`].includes(url.hostname)) return SITE_ORIGIN;
      return `${SITE_ORIGIN}${url.pathname}`;
    } catch {
      return SITE_ORIGIN;
    }
  }
  if (!pathOrUrl.startsWith('/') || pathOrUrl.startsWith('//')) return SITE_ORIGIN;
  const path = pathOrUrl.split(/[?#]/)[0];
  return `${SITE_ORIGIN}${path === '/' ? '' : path.replace(/\/+$/, '')}` || SITE_ORIGIN;
}

/** Canonical URL for a path: the origin, the path, no query, no fragment, no trailing slash (except the root). */
export function canonicalUrl(path: string): string {
  const url = absoluteUrl(path);
  return path === '/' ? `${SITE_ORIGIN}/` : url;
}

/**
 * Locale-aware canonical: honors the active URL language so a `/de/products/foo` page
 * emits `https://legendary-branding.com/de/products/foo`, not the EN root. Reads the
 * language from the root route's loader (`matches[0].data.localization.language.isoCode`).
 * Falls back to the unprefixed canonical when the language can't be resolved.
 *
 * Deliberately defined here (not in locale.ts) so route meta code already importing
 * `canonicalUrl` can swap to this helper with a single-line change.
 */
export function canonicalLocaleUrl(path: string, matches: unknown): string {
  const bare = canonicalUrl(path);
  const list = Array.isArray(matches) ? matches : [];
  const root = list.find((m): m is {data?: {localization?: {language?: {isoCode?: string}}}} =>
    typeof m === 'object' && m !== null && (m as {id?: string}).id === 'root',
  );
  const isoCode = root?.data?.localization?.language?.isoCode;
  if (typeof isoCode !== 'string' || isoCode === 'EN') return bare;
  const language = toSupportedLanguage(isoCode);
  if (!language || language === 'EN') return bare;
  try {
    const bareUrl = new URL(bare);
    const localized = localizePath(bareUrl.pathname === '' ? '/' : bareUrl.pathname, language);
    return `${SITE_ORIGIN}${localized}`;
  } catch {
    return bare;
  }
}

/**
 * Adds Shopify CDN image-transform parameters to an image URL that may or may not already have a query
 * string, replacing any it already carries. A value that is not an http(s) URL yields undefined.
 */
export function withImageTransform(
  imageUrl: string | null | undefined,
  transform: {width: number; height?: number},
): string | undefined {
  if (!imageUrl) return undefined;
  let url: URL;
  try {
    url = new URL(imageUrl);
  } catch {
    return undefined;
  }
  if (url.protocol !== 'https:' && url.protocol !== 'http:') return undefined;
  url.searchParams.set('width', String(Math.round(transform.width)));
  if (transform.height) url.searchParams.set('height', String(Math.round(transform.height)));
  else url.searchParams.delete('height');
  return url.toString();
}

/** A real, supported logo file that exists in /public (used when Shopify has no brand logo). */
export const FALLBACK_LOGO_URL = `${SITE_ORIGIN}/icon-512.png`;
