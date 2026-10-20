/**
 * Decides whether a request should publish analytics to the live Shopify shop.
 *
 * Hydrogen's `Analytics.Provider` reports to the real store whenever it is
 * given a `shop` value, and `shopify hydrogen dev` is a real Hydrogen server —
 * so a developer browsing http://localhost:3000 writes page views, product
 * views and cart events into the production shop's analytics alongside actual
 * customers.
 *
 * That is not hypothetical here. Over one 90-day window the shop recorded
 * roughly 2,100 sessions whose landing pages were `http://127.0.0.1:3000/...`,
 * making a developer's laptop the single largest "landing page" in the store
 * and leaving every session, conversion-rate and channel report wrong. Oxygen
 * preview deployments leak the same way, in smaller numbers.
 *
 * The host is the signal, not the build mode: a production build previewed
 * locally still runs on loopback, and `shopify hydrogen preview` serves a
 * production bundle on localhost.
 */

const LOOPBACK = new Set(['localhost', '127.0.0.1', '::1', '0.0.0.0']);

/**
 * Hosts that are a developer's machine rather than a customer's browser.
 *
 * `.tryhydrogen.dev` is Hydrogen's local HTTPS host (`local.tryhydrogen.dev`),
 * which resolves to the developer's own machine despite looking like a public
 * domain. vite.config.ts already allows it, so it is in active use here and
 * would otherwise be read as the live storefront.
 */
function isLocalHost(host: string): boolean {
  if (LOOPBACK.has(host) || host.endsWith('.localhost') || host.endsWith('.local')) return true;
  if (host === 'tryhydrogen.dev' || host.endsWith('.tryhydrogen.dev')) return true;
  if (/^127\./.test(host) || /^10\./.test(host) || /^192\.168\./.test(host)) return true;
  return /^172\.(1[6-9]|2\d|3[01])\./.test(host);
}

/** Shopify-hosted preview and development domains, not the live storefront. */
function isPreviewHost(host: string): boolean {
  return host.endsWith('.myshopify.dev') || host.endsWith('.shopifypreview.com');
}

export type AnalyticsEnvironment = {
  /** False when reporting would pollute the live shop's analytics. */
  reportToShop: boolean;
  /** Why, for the one-line server log on startup. */
  reason: string;
};

export function analyticsEnvironment(requestUrl: string): AnalyticsEnvironment {
  let host: string;
  try {
    host = new URL(requestUrl).hostname.toLowerCase().replace(/^\[|\]$/g, '');
  } catch {
    // An unparseable URL is not evidence that this is production. Fail closed:
    // losing a few analytics events costs nothing, polluting the shop's
    // reporting costs every decision made from it afterwards.
    return {reportToShop: false, reason: 'request URL could not be parsed'};
  }

  if (isLocalHost(host)) return {reportToShop: false, reason: `local development host ${host}`};
  if (isPreviewHost(host)) return {reportToShop: false, reason: `preview host ${host}`};
  return {reportToShop: true, reason: `live storefront host ${host}`};
}
