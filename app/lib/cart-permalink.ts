/**
 * Cart permalinks: `/cart/{variantId}:{qty}[,{variantId}:{qty}...]`.
 *
 * Shopify's Liquid storefront serves these natively; Google Merchant Center
 * feeds (e.g. Simprosys) use them as the `checkout_link_template`. On a
 * headless storefront the route has to exist or the feed is rejected.
 */

export type PermalinkLine = {merchandiseId: string; quantity: number};

const MAX_LINES = 20;
const MAX_QUANTITY = 99;
const VARIANT_ID = /^\d{1,20}$/;
const QUANTITY = /^\d{1,3}$/;
const DISCOUNT_CODE = /^[\w.\- ]{1,64}$/;

/** Parses the `:lines` route param. Returns null when any part is malformed. */
export function parsePermalinkLines(param: string | undefined): PermalinkLine[] | null {
  if (!param) return null;
  const parts = param.split(',');
  if (parts.length > MAX_LINES) return null;

  const lines: PermalinkLine[] = [];
  for (const part of parts) {
    const [variantId, rawQuantity, ...rest] = part.split(':');
    if (rest.length > 0 || !VARIANT_ID.test(variantId ?? '')) return null;
    // A bare variant id means quantity 1, matching Shopify's behaviour.
    const quantity = rawQuantity === undefined ? 1 : QUANTITY.test(rawQuantity) ? Number(rawQuantity) : NaN;
    if (!Number.isInteger(quantity) || quantity < 1 || quantity > MAX_QUANTITY) return null;
    lines.push({merchandiseId: `gid://shopify/ProductVariant/${variantId}`, quantity});
  }
  return lines;
}

/** Returns the trimmed `?discount=` code, or null when absent or invalid. */
export function parsePermalinkDiscount(value: string | null): string | null {
  const code = value?.trim();
  return code && DISCOUNT_CODE.test(code) ? code : null;
}
