/**
 * Collections.$handle route loader tests.
 *
 * Tests the PLP loader directly with a mocked storefront.
 * CRITICAL: this test would have caught the invalid 'totalCount' field bug
 * if the mock storefront did schema-aware validation.
 * At minimum, it verifies the loader doesn't throw and returns expected shape.
 */

import {describe, it, expect, beforeEach} from 'vitest';
import {loader} from '~/routes/collections.$handle';
import {createMockStorefront} from '~/test/mock-storefront';

describe('collections.$handle loader', () => {
  let mockStorefront: ReturnType<typeof createMockStorefront>;

  const mockCollection = {
    id: 'gid://shopify/Collection/123',
    title: 'All Products',
    handle: 'all-products',
    description: '',
    image: null,
    products: {
      nodes: [
        {
          id: 'gid://shopify/Product/1',
          title: 'Test Product',
          handle: 'test-product',
        },
      ],
      totalCount: 1,
      pageInfo: {
        hasPreviousPage: false,
        hasNextPage: false,
        startCursor: null,
        endCursor: null,
      },
      filters: [],
    },
  };

  beforeEach(() => {
    mockStorefront = createMockStorefront({
      responses: {
        Collection: {collection: mockCollection},
      },
    });
  });

  it('runs without throwing on happy-path data', async () => {
    const context = mockStorefront.createContext();
    const request = new Request('http://localhost/collections/all-products');
    const params = {handle: 'all-products'};

    // @ts-expect-error - minimal mock context
    const result = await loader({request, context, params});

    expect(result).toBeDefined();
    expect(result.collection).toBeDefined();
    expect(result.sort).toBeDefined();
  });

  it('calls storefront.query with the Collection operation', async () => {
    const context = mockStorefront.createContext();
    const request = new Request('http://localhost/collections/all-products');
    const params = {handle: 'all-products'};

    // @ts-expect-error - minimal mock context
    await loader({request, context, params});

    const calls = mockStorefront.getCalls();
    expect(calls).toHaveLength(1);
    expect(calls[0].operationName).toBe('Collection');
  });

  it('passes the handle from params to the query', async () => {
    const context = mockStorefront.createContext();
    const request = new Request('http://localhost/collections/test-handle');
    const params = {handle: 'test-handle'};

    // @ts-expect-error - minimal mock context
    await loader({request, context, params});

    const calls = mockStorefront.getCalls();
    expect(calls[0].variables.handle).toBe('test-handle');
  });

  it('passes country and language variables', async () => {
    const context = mockStorefront.createContext();
    const request = new Request('http://localhost/collections/all-products');
    const params = {handle: 'all-products'};

    // @ts-expect-error - minimal mock context
    await loader({request, context, params});

    const calls = mockStorefront.getCalls();
    expect(calls[0].variables.country).toBe('US');
    expect(calls[0].variables.language).toBe('EN');
  });

  it('returns products from the collection', async () => {
    const context = mockStorefront.createContext();
    const request = new Request('http://localhost/collections/all-products');
    const params = {handle: 'all-products'};

    // @ts-expect-error - minimal mock context
    const result = await loader({request, context, params});

    expect(result.collection.products.nodes).toHaveLength(1);
    expect(result.collection.products.nodes[0].handle).toBe('test-product');
  });

  it('returns sort parameter (default = featured)', async () => {
    const context = mockStorefront.createContext();
    const request = new Request('http://localhost/collections/all-products');
    const params = {handle: 'all-products'};

    // @ts-expect-error - minimal mock context
    const result = await loader({request, context, params});

    expect(result.sort).toBe('featured');
  });

  it('reads sort from search params', async () => {
    const context = mockStorefront.createContext();
    const request = new Request('http://localhost/collections/all-products?sort=price-asc');
    const params = {handle: 'all-products'};

    // @ts-expect-error - minimal mock context
    const result = await loader({request, context, params});

    expect(result.sort).toBe('price-asc');
  });

  it('returns activeFilters when filters are in URL', async () => {
    const context = mockStorefront.createContext();
    const request = new Request('http://localhost/collections/all-products?in_stock=1&type=T-Shirt');
    const params = {handle: 'all-products'};

    // @ts-expect-error - minimal mock context
    const result = await loader({request, context, params});

    expect(result.activeFilters).not.toBeNull();
    expect(result.activeFilters).toHaveLength(2);
  });

  describe('URL parameter handling', () => {
    async function variablesFor(search: string) {
      const context = mockStorefront.createContext();
      const request = new Request(`http://localhost/collections/all-products${search}`);
      // @ts-expect-error - minimal mock context
      await loader({request, context, params: {handle: 'all-products'}});
      return mockStorefront.getCalls()[0].variables as Record<string, unknown>;
    }

    it('ignores malformed price bounds instead of sending NaN or Infinity to Shopify', async () => {
      for (const search of ['?price_min=NaN', '?price_max=Infinity', '?price_min=-5', '?price_min=abc&price_max=1e999']) {
        mockStorefront = createMockStorefront({responses: {Collection: {collection: mockCollection}}});
        const vars = await variablesFor(search);
        expect(vars.filters).toBeUndefined();
      }
    });

    it('swaps an inverted price range and keeps valid bounds', async () => {
      mockStorefront = createMockStorefront({responses: {Collection: {collection: mockCollection}}});
      const vars = await variablesFor('?price_min=90&price_max=20');
      expect(vars.filters).toEqual([{price: {min: 20, max: 90}}]);
    });

    it('bounds free-text filters and the number of tags', async () => {
      mockStorefront = createMockStorefront({responses: {Collection: {collection: mockCollection}}});
      const tags = Array.from({length: 30}, (_, i) => `tag=t${i}`).join('&');
      const vars = await variablesFor(`?type=${'x'.repeat(500)}&${tags}`);
      const filters = vars.filters as Array<Record<string, string>>;
      expect(filters.find((f) => 'productType' in f)?.productType).toHaveLength(100);
      expect(filters.filter((f) => 'tag' in f)).toHaveLength(10);
    });

    it('loads the previous page backwards when direction=previous', async () => {
      mockStorefront = createMockStorefront({responses: {Collection: {collection: mockCollection}}});
      const vars = await variablesFor('?cursor=abc&direction=previous');
      expect(vars).toMatchObject({last: 12, startCursor: 'abc'});
      expect(vars.first).toBeUndefined();
    });

    it('falls back to the default sort for an unknown sort value', async () => {
      mockStorefront = createMockStorefront({responses: {Collection: {collection: mockCollection}}});
      const vars = await variablesFor('?sort=DROP_TABLE');
      expect(vars.sortKey).toBeDefined();
    });
  });
});
