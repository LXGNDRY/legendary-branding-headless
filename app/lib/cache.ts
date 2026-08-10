/**
 * Caching strategy for Legendary Branding Headless
 *
 * Three tiers, per Hydrogen conventions:
 *  - CacheLong   = stable content that rarely changes (products, collections, blog)
 *  - CacheShort  = dynamic but public content (homepage, collection listings)
 *  - CacheNone   = per-user / dynamic content (cart, account, search results)
 *
 * All values are tuned for a streetwear DTC store:
 *  - Product pages change infrequently (restocks, price changes ~daily)
 *  - Collection listings change on drops (weekly-ish)
 *  - Cart/account must never be cached
 */

import {
  CacheLong as H2CacheLong,
  CacheShort as H2CacheShort,
  CacheNone as H2CacheNone,
} from '@shopify/hydrogen';

/**
 * Stable, rarely-changing content.
 * Use for: product details, collection metadata, blog articles, policy pages.
 * TTL: 1 hour, stale-while-revalidate 24 hours, stale-if-error 7 days.
 */
export const CacheLong = () =>
  H2CacheLong({
    maxAge: 60 * 60, // 1 hour
    staleWhileRevalidate: 60 * 60 * 24, // 24 hours
    staleIfError: 60 * 60 * 24 * 7, // 7 days
  });

/**
 * Dynamic but public, cacheable content.
 * Use for: homepage, collection listings, search (if implemented), product recommendations.
 * TTL: 1 minute, stale-while-revalidate 15 minutes, stale-if-error 1 hour.
 */
export const CacheShort = () =>
  H2CacheShort({
    maxAge: 60, // 1 minute
    staleWhileRevalidate: 60 * 15, // 15 minutes
    staleIfError: 60 * 60, // 1 hour
  });

/**
 * No caching — always fetch fresh.
 * Use for: cart, account, checkout, form submissions, personalized content.
 */
export const CacheNone = () => H2CacheNone();

/**
 * Full-page HTML cache headers for anonymous pages.
 * Applies to the HTML document itself (CDN + browser).
 *
 * Most pages should use CacheShort at the HTML level (so the page feels instant
 * while the data underneath can be fresher if needed).
 */
export function htmlCacheHeaders(cacheControl: string = 'public, max-age=60, stale-while-revalidate=900') {
  return {
    'Cache-Control': cacheControl,
  };
}

/**
 * Returns Cache-Control headers that prevent any caching.
 * For cart, account, and all personalized routes.
 */
export function noCacheHeaders() {
  return {
    'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
  };
}
