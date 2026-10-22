/**
 * Unit tests for ProductCard's sale-detection math -- isOnSale/percentOff
 * drive the Sale badge and strikethrough price everywhere a ProductCard
 * renders (PLP, collections, home, search, wishlist). Covering the pure
 * logic directly avoids needing a full component-render harness (this repo
 * has none) while still guarding the actual calculation.
 */

import {describe, it, expect} from 'vitest';
import {isOnSale, percentOff, type ProductCardFragment} from './ProductCard';

function product(overrides: Partial<ProductCardFragment> = {}): ProductCardFragment {
  return {
    id: 'gid://shopify/Product/1',
    title: 'Test Product',
    handle: 'test-product',
    availableForSale: true,
    priceRange: {
      minVariantPrice: {amount: '80.00', currencyCode: 'USD'},
      maxVariantPrice: {amount: '80.00', currencyCode: 'USD'},
    },
    compareAtPriceRange: {
      minVariantPrice: {amount: '80.00', currencyCode: 'USD'},
    },
    tags: [],
    ...overrides,
  };
}

const variantPair = (price: string, compareAt: string | null): ProductCardFragment['selectedOrFirstAvailableVariant'] => ({
  id: 'gid://shopify/ProductVariant/1',
  availableForSale: true,
  price: {amount: price, currencyCode: 'USD'},
  compareAtPrice: compareAt ? {amount: compareAt, currencyCode: 'USD'} : null,
});

describe('isOnSale', () => {
  it('is true when the variant compareAtPrice exceeds its price', () => {
    expect(isOnSale(product({selectedOrFirstAvailableVariant: variantPair('80.00', '100.00')}))).toBe(true);
  });

  it('is false when compareAtPrice equals price', () => {
    expect(isOnSale(product({selectedOrFirstAvailableVariant: variantPair('80.00', '80.00')}))).toBe(false);
  });

  it('is false when compareAtPrice is below price', () => {
    expect(isOnSale(product({selectedOrFirstAvailableVariant: variantPair('80.00', '60.00')}))).toBe(false);
  });
});

describe('percentOff', () => {
  it('computes a whole-percent discount off the compare-at price', () => {
    expect(percentOff(product({selectedOrFirstAvailableVariant: variantPair('80.00', '100.00')}))).toBe(20);
  });

  it('returns null when not on sale', () => {
    expect(percentOff(product({selectedOrFirstAvailableVariant: variantPair('80.00', '80.00')}))).toBeNull();
  });

  it('rounds to the nearest whole percent', () => {
    expect(percentOff(product({selectedOrFirstAvailableVariant: variantPair('67.00', '100.00')}))).toBe(33);
  });
});

describe('salePricePair variant precedence (regression: mismatched range minima)', () => {
  // priceRange.minVariantPrice and compareAtPriceRange.minVariantPrice are
  // each independently the minimum across ALL variants -- on a product with
  // a regular $50 variant and an $80 variant discounted from $100, those
  // minima describe different variants ($50 regular, $100 compareAt) and
  // would wrongly suggest a 50% sale. The selected/first-available variant's
  // own price pair must take precedence.
  const mismatchedRangeProduct = product({
    priceRange: {
      minVariantPrice: {amount: '50.00', currencyCode: 'USD'}, // a different, regular-priced variant
      maxVariantPrice: {amount: '100.00', currencyCode: 'USD'},
    },
    compareAtPriceRange: {minVariantPrice: {amount: '100.00', currencyCode: 'USD'}}, // the $80 variant's compareAt
  });

  it('uses the selected variant pair instead of the mismatched range minima', () => {
    const withVariant: ProductCardFragment = {
      ...mismatchedRangeProduct,
      selectedOrFirstAvailableVariant: {
        id: 'gid://shopify/ProductVariant/1',
        availableForSale: true,
        price: {amount: '80.00', currencyCode: 'USD'},
        compareAtPrice: {amount: '100.00', currencyCode: 'USD'},
      },
    };

    expect(isOnSale(withVariant)).toBe(true);
    expect(percentOff(withVariant)).toBe(20); // not 50 -- the range-minima mismatch
  });

  it('reports not on sale when the selected variant has no compareAtPrice, even if range minima mismatch would suggest otherwise', () => {
    const regularVariant: ProductCardFragment = {
      ...mismatchedRangeProduct,
      selectedOrFirstAvailableVariant: {
        id: 'gid://shopify/ProductVariant/2',
        availableForSale: true,
        price: {amount: '50.00', currencyCode: 'USD'},
        compareAtPrice: null,
      },
    };

    expect(isOnSale(regularVariant)).toBe(false);
    expect(percentOff(regularVariant)).toBeNull();
  });

  it('makes no sale claim when no variant-level price was fetched (never pairs range minima)', () => {
    const noVariantData: ProductCardFragment = {
      ...mismatchedRangeProduct,
      selectedOrFirstAvailableVariant: null,
    };

    expect(isOnSale(noVariantData)).toBe(false);
    expect(percentOff(noVariantData)).toBeNull();
  });
});
