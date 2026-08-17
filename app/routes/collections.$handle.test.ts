/**
 * Collections.$handle route loader tests.
 *
 * Tests the PLP loader directly with a mocked storefront.
 * CRITICAL: this test would have caught the invalid 'totalCount' field bug
 * if the mock storefront did schema-aware validation.
 * At minimum, it verifies the loader doesn't throw and returns expected shape.
 */

import {describe, it, expect, beforeEach} from 'vitest';
import {loader} from './collections.$handle';
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
});
