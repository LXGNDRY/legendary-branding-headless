/**
 * Search route loader tests.
 */

import {describe, it, expect, beforeEach} from 'vitest';
import {loader} from '~/routes/search';
import {createMockStorefront} from '~/test/mock-storefront';

describe('search loader', () => {
  let mockStorefront: ReturnType<typeof createMockStorefront>;

  beforeEach(() => {
    mockStorefront = createMockStorefront({
      responses: {
        Search: {
          products: {nodes: [], totalCount: 0},
          collections: {nodes: [], totalCount: 0},
          pages: {nodes: [], totalCount: 0},
        },
      },
    });
  });

  it('runs without throwing with no query', async () => {
    const context = mockStorefront.createContext();
    const request = new Request('http://localhost/search');
    const params = {};

    // @ts-expect-error - minimal mock context
    const result = await loader({request, context, params});

    expect(result).toBeDefined();
  });

  it('reads q from search params', async () => {
    const context = mockStorefront.createContext();
    const request = new Request('http://localhost/search?q=hoodie');
    const params = {};

    // @ts-expect-error - minimal mock context
    const result = await loader({request, context, params});

    expect(result.query).toBe('hoodie');
  });

  it('returns null search when no query', async () => {
    const context = mockStorefront.createContext();
    const request = new Request('http://localhost/search');
    const params = {};

    // @ts-expect-error - minimal mock context
    const result = await loader({request, context, params});

    expect(result.query).toBe('');
    expect(result.search).toBeNull();
  });

  // Regression test: the search route used to fake
  // `compareAtPriceRange: product.priceRange` when building ProductCard
  // props, which made every discounted product look full-price on the
  // search results page (no real compareAt data was even fetched). The
  // fix is fetching the real field and passing the product through
  // unmodified -- assert both halves so a regression on either one fails
  // the test.
  it('fetches real compareAtPriceRange data (not faked from priceRange)', async () => {
    const context = mockStorefront.createContext();
    const request = new Request('http://localhost/search?q=jacket');
    const params = {};

    // @ts-expect-error - minimal mock context
    await loader({request, context, params});

    const call = mockStorefront.getCalls().find((c) => c.operationName === 'Search');
    expect(call?.query).toContain('compareAtPriceRange');
  });

  it('passes through real compareAtPriceRange on each product node unmodified', async () => {
    mockStorefront.setMockResponse('Search', {
      search: {
      totalCount: 1,
      pageInfo: {hasNextPage: false, hasPreviousPage: false, startCursor: '', endCursor: ''},
      products: [
        {
          cursor: 'c1',
          node: {
            id: 'gid://shopify/Product/1',
            title: 'Discounted Jacket',
            handle: 'discounted-jacket',
            vendor: 'Legendary Branding',
            productType: 'Jacket',
            availableForSale: true,
            tags: [],
            description: '',
            featuredImage: null,
            priceRange: {
              minVariantPrice: {amount: '80.00', currencyCode: 'USD'},
              maxVariantPrice: {amount: '80.00', currencyCode: 'USD'},
            },
            compareAtPriceRange: {
              minVariantPrice: {amount: '100.00', currencyCode: 'USD'},
            },
            reviewBadge: null,
          },
        },
      ],
      productFilters: [],
      },
    });

    const context = mockStorefront.createContext();
    const request = new Request('http://localhost/search?q=jacket');
    const params = {};

    // @ts-expect-error - minimal mock context
    const result = await loader({request, context, params});

    const product = result.search?.products[0]?.node;
    expect(product?.compareAtPriceRange.minVariantPrice.amount).toBe('100.00');
    // The bug this guards against: compareAtPriceRange silently equal to
    // priceRange would hide the discount even though real data was fetched.
    expect(product?.compareAtPriceRange.minVariantPrice.amount).not.toBe(
      product?.priceRange.minVariantPrice.amount,
    );
  });
});
