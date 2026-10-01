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

describe('isOnSale', () => {
  it('is true when compareAtPrice exceeds price', () => {
    expect(
      isOnSale(
        product({
          priceRange: {
            minVariantPrice: {amount: '80.00', currencyCode: 'USD'},
            maxVariantPrice: {amount: '80.00', currencyCode: 'USD'},
          },
          compareAtPriceRange: {minVariantPrice: {amount: '100.00', currencyCode: 'USD'}},
        }),
      ),
    ).toBe(true);
  });

  it('is false when compareAtPrice equals price (the search/wishlist bug this guards)', () => {
    expect(
      isOnSale(
        product({
          priceRange: {
            minVariantPrice: {amount: '80.00', currencyCode: 'USD'},
            maxVariantPrice: {amount: '80.00', currencyCode: 'USD'},
          },
          compareAtPriceRange: {minVariantPrice: {amount: '80.00', currencyCode: 'USD'}},
        }),
      ),
    ).toBe(false);
  });

  it('is false when compareAtPrice is below price', () => {
    expect(
      isOnSale(
        product({
          priceRange: {
            minVariantPrice: {amount: '80.00', currencyCode: 'USD'},
            maxVariantPrice: {amount: '80.00', currencyCode: 'USD'},
          },
          compareAtPriceRange: {minVariantPrice: {amount: '60.00', currencyCode: 'USD'}},
        }),
      ),
    ).toBe(false);
  });
});

describe('percentOff', () => {
  it('computes a whole-percent discount off the compare-at price', () => {
    const pct = percentOff(
      product({
        priceRange: {
          minVariantPrice: {amount: '80.00', currencyCode: 'USD'},
          maxVariantPrice: {amount: '80.00', currencyCode: 'USD'},
        },
        compareAtPriceRange: {minVariantPrice: {amount: '100.00', currencyCode: 'USD'}},
      }),
    );
    expect(pct).toBe(20);
  });

  it('returns null when not on sale', () => {
    expect(
      percentOff(
        product({
          priceRange: {
            minVariantPrice: {amount: '80.00', currencyCode: 'USD'},
            maxVariantPrice: {amount: '80.00', currencyCode: 'USD'},
          },
          compareAtPriceRange: {minVariantPrice: {amount: '80.00', currencyCode: 'USD'}},
        }),
      ),
    ).toBeNull();
  });

  it('rounds to the nearest whole percent', () => {
    const pct = percentOff(
      product({
        priceRange: {
          minVariantPrice: {amount: '67.00', currencyCode: 'USD'},
          maxVariantPrice: {amount: '67.00', currencyCode: 'USD'},
        },
        compareAtPriceRange: {minVariantPrice: {amount: '100.00', currencyCode: 'USD'}},
      }),
    );
    expect(pct).toBe(33);
  });
});
