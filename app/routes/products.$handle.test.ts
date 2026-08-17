/**
 * Products.$handle route loader tests.
 *
 * Tests the PDP loader directly with a mocked storefront.
 */

import {describe, it, expect, beforeEach} from 'vitest';
import {loader} from './products.$handle';
import {createMockStorefront} from '~/test/mock-storefront';

describe('products.$handle loader', () => {
  let mockStorefront: ReturnType<typeof createMockStorefront>;

  const mockProduct = {
    id: 'gid://shopify/Product/456',
    title: 'Test Product',
    handle: 'test-product',
    description: '',
    descriptionHtml: '',
    options: [],
    images: {nodes: []},
    variants: {
      nodes: [
        {
          id: 'gid://shopify/ProductVariant/789',
          title: 'Default Title',
          price: {amount: '49.00', currencyCode: 'USD'},
          availableForSale: true,
        },
      ],
    },
    seo: {title: null, description: null},
  };

  beforeEach(() => {
    mockStorefront = createMockStorefront({
      responses: {
        Product: {product: mockProduct},
      },
    });
  });

  it('runs without throwing on happy-path data', async () => {
    const context = mockStorefront.createContext();
    const request = new Request('http://localhost/products/test-product');
    const params = {handle: 'test-product'};

    // @ts-expect-error - minimal mock context
    const result = await loader({request, context, params});

    expect(result).toBeDefined();
    expect(result.product).toBeDefined();
  });

  it('calls storefront.query with the Product operation', async () => {
    const context = mockStorefront.createContext();
    const request = new Request('http://localhost/products/test-product');
    const params = {handle: 'test-product'};

    // @ts-expect-error - minimal mock context
    await loader({request, context, params});

    const calls = mockStorefront.getCalls();
    expect(calls).toHaveLength(1);
    expect(calls[0].operationName).toBe('Product');
  });

  it('passes the handle from params to the query', async () => {
    const context = mockStorefront.createContext();
    const request = new Request('http://localhost/products/my-product');
    const params = {handle: 'my-product'};

    // @ts-expect-error - minimal mock context
    await loader({request, context, params});

    const calls = mockStorefront.getCalls();
    expect(calls[0].variables.handle).toBe('my-product');
  });

  it('returns product with variants', async () => {
    const context = mockStorefront.createContext();
    const request = new Request('http://localhost/products/test-product');
    const params = {handle: 'test-product'};

    // @ts-expect-error - minimal mock context
    const result = await loader({request, context, params});

    expect(result.product.title).toBe('Test Product');
    expect(result.product.variants.nodes).toHaveLength(1);
  });
});
