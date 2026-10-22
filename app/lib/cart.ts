import type {CurrencyCode} from '@shopify/hydrogen/storefront-api-types';

export type CartMoney = {amount: string; currencyCode: CurrencyCode};

export type CartLineImage = {
  url: string;
  altText?: string | null;
  width?: number | null;
  height?: number | null;
};

export type CartLineMerchandise = {
  id: string;
  title: string;
  price: CartMoney;
  image?: CartLineImage | null;
  selectedOptions: {name: string; value: string}[];
  product: {title: string; handle: string};
};

export type CartDiscountAllocation = {
  discountedAmount: CartMoney;
  /** Present for a code-based discount (`CartCodeDiscountAllocation`). */
  code?: string;
  /** Present for automatic/custom discounts (`CartAutomaticDiscountAllocation` / `CartCustomDiscountAllocation`). */
  title?: string;
};

export type CartLineData = {
  id: string;
  quantity: number;
  merchandise: CartLineMerchandise;
  cost: {
    totalAmount: CartMoney;
    amountPerQuantity: CartMoney;
    compareAtAmountPerQuantity?: CartMoney | null;
  };
  /**
   * Line-scoped discounts (e.g. a "25% off OUTERWEAR" automatic discount
   * that targets specific line items) — distinct from `CartData.discountAllocations`,
   * which only covers cart-scoped discounts. A discount can allocate at
   * either level depending on how it's configured in Shopify Admin, so both
   * must be checked to show every applied discount.
   */
  discountAllocations?: CartDiscountAllocation[];
};

/**
 * Pins the checkout to the English locale explicitly.
 *
 * Shopify's Cart API returns `checkoutUrl` with no locale segment or query
 * param at all -- the shop has 6 published locales (en/de/es/fr/id/pt-BR)
 * on one "Worldwide" market, so an unpinned checkout falls back to
 * Shopify's own locale auto-detection from the visitor's browser
 * `Accept-Language` header. That can silently switch checkout into a
 * comma-decimal locale (French/German/Spanish/Portuguese all use `,` for
 * the decimal separator) even though the storefront itself is English-only
 * (this app hardcodes `language: 'EN'` everywhere) and the currency is
 * always USD -- producing a jarring "$120,00" on an otherwise English page.
 */
export function withCheckoutLocale(checkoutUrl: string): string {
  try {
    const url = new URL(checkoutUrl);
    url.searchParams.set('locale', 'en');
    return url.toString();
  } catch {
    // Malformed URL (shouldn't happen for a real Shopify checkoutUrl) --
    // fall back to the original rather than throwing on a render path.
    return checkoutUrl;
  }
}

export type CartData = {
  id: string;
  checkoutUrl: string;
  totalQuantity: number;
  lines: {edges: Array<{node: CartLineData}>};
  cost: {
    subtotalAmount: CartMoney;
    totalAmount: CartMoney;
  };
  discountCodes?: {code: string; applicable: boolean}[];
  discountAllocations?: CartDiscountAllocation[];
} | null | undefined;
