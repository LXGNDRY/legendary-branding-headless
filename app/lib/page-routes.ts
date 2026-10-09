/**
 * Shopify Pages that are the store's policy/help documents. The footer links
 * them under /policies/, so that is their canonical home; every other Shopify
 * Page lives under /pages/. Both routes can render any page handle, so each
 * one points its canonical (and the sitemap) at the single URL chosen here.
 */
export const POLICY_PAGE_HANDLES = [
  'refund-policy',
  'terms-of-service',
  'privacy-with-legendary-branding',
  'shipping-policy',
  'size-guide',
  'about',
  'contact',
  'legendary_branding_faqs',
] as const;

export type PolicyPageHandle = (typeof POLICY_PAGE_HANDLES)[number];

export function isPolicyPageHandle(handle: string): handle is PolicyPageHandle {
  return (POLICY_PAGE_HANDLES as readonly string[]).includes(handle);
}

/** The one URL path a Shopify Page should be indexed under. */
export function canonicalPagePath(handle: string): string {
  return `${isPolicyPageHandle(handle) ? '/policies/' : '/pages/'}${handle}`;
}
