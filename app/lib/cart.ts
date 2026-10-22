import type {CurrencyCode} from '@shopify/hydrogen/storefront-api-types';
import {checkoutLocale} from '~/lib/locale';

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
 * Pins checkout to the shopper's selected storefront language.
 *
 * Shopify's Cart API returns `checkoutUrl` with no locale, so checkout would
 * otherwise guess from the browser's Accept-Language header and can disagree
 * with the language (and decimal separators) the shopper chose on the site.
 */
export function withCheckoutLocale(checkoutUrl: string, language?: string | null): string {
  try {
    const url = new URL(checkoutUrl);
    url.searchParams.set('locale', checkoutLocale(language));
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
