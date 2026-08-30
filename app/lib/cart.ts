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

export type CartLineData = {
  id: string;
  quantity: number;
  merchandise: CartLineMerchandise;
  cost: {totalAmount: CartMoney};
};

export type CartDiscountAllocation = {
  discountedAmount: CartMoney;
  /** Present for a code-based discount (`CartCodeDiscountAllocation`). */
  code?: string;
  /** Present for automatic/custom discounts (`CartAutomaticDiscountAllocation` / `CartCustomDiscountAllocation`). */
  title?: string;
};

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
