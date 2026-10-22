/**
 * Products.$handle route loader tests.
 *
 * The PDP loads editorial content (long cache) and commerce data (short cache,
 * paginated variants) separately and merges them.
 */

import {describe, it, expect, beforeEach, afterEach, vi} from 'vitest';
import {loader} from '~/routes/products.$handle';
import {CacheFresh, CacheLong} from '~/lib/cache';
import {createMockStorefront} from '~/test/mock-storefront';

const variant = (n: number, extra: Record<string, unknown> = {}) => ({
  id: `gid://shopify/ProductVariant/${n}`,
  sku: `SKU-${n}`,
  availableForSale: true,
  quantityAvailable: 5,
  selectedOptions: [{name: 'Size', value: `S${n}`}],
  price: {amount: '49.00', currencyCode: 'USD'},
  compareAtPrice: null,
  image: null,
  ...extra,
});

const content = {
  id: 'gid://shopify/Product/456',
  title: 'Test Product',
  handle: 'test-product',
  descriptionHtml: '',
  tags: [],
  vendor: 'LB',
  productType: 'Tee',
  metafields: [],
  images: {nodes: []},
};

const options = [{id: 'gid://shopify/ProductOption/1', name: 'Size', optionValues: [{name: 'S1', swatch: null}]}];

function page(nodes: unknown[], endCursor: string | null) {
  return {nodes, pageInfo: {hasNextPage: endCursor !== null, endCursor}};
}

function run(handle: string, responses: Record<string, unknown>, search = '') {
  const mock = createMockStorefront({responses});
  const context = mock.createContext();
  // @ts-expect-error - minimal mock context
  return loader({request: new Request(`http://localhost/products/${handle}${search}`), context, params: {handle}}).then((result) => ({
    result,
    calls: mock.getCalls(),
  }));
}

describe('products.$handle loader', () => {
  let responses: Record<string, unknown>;

  beforeEach(() => {
    responses = {
      Product: {product: content},
      ProductCommerce: () => ({
        product: {id: content.id, options, selectedVariant: variant(1), variants: page([variant(1)], null)},
        relatedProducts: {products: {nodes: []}},
      }),
    };
  });

  it('merges editorial content with fresh commerce data', async () => {
    const {result} = await run('test-product', responses);
    expect(result.product.title).toBe('Test Product');
    expect(result.product.variants.nodes).toHaveLength(1);
    expect(result.product.selectedVariant?.id).toBe('gid://shopify/ProductVariant/1');
    expect(result.relatedProducts).toEqual({products: {nodes: []}});
  });

  it('queries content and commerce separately with the handle and market', async () => {
    const {calls} = await run('my-product', responses);
    expect(calls.map((c) => c.operationName).sort()).toEqual(['Product', 'ProductCommerce']);
    for (const call of calls) {
      expect(call.variables.handle).toBe('my-product');
      expect(call.variables).toMatchObject({country: 'US', language: 'EN'});
    }
  });

  it('returns a 404 when the product does not exist', async () => {
    responses.Product = {product: null};
    await expect(run('nope', responses)).rejects.toMatchObject({status: 404});
  });

  it('returns a 404 when cached content exists but the live product was deleted or unpublished', async () => {
    responses.ProductCommerce = () => ({product: null, relatedProducts: null});
    await expect(run('gone', responses)).rejects.toMatchObject({status: 404});
  });

  it('never merges cached content with a different product after a handle was reassigned', async () => {
    responses.ProductCommerce = () => ({
      product: {id: 'gid://shopify/Product/999', options, selectedVariant: variant(1), variants: page([variant(1)], null)},
      relatedProducts: {products: {nodes: []}},
    });
    await expect(run('reused', responses)).rejects.toMatchObject({status: 404});
  });

  it('takes option definitions from the fresh commerce query so a new option value is selectable immediately', async () => {
    const {result, calls} = await run('test-product', responses);
    expect(result.product.options).toEqual(options);
    expect(calls.find((c) => c.operationName === 'Product')?.query).not.toContain('optionValues');
  });

  it('reads up to the 2,048-variant product limit (21 pages)', async () => {
    const pageOf = (n: number) => Array.from({length: n === 20 ? 48 : 100}, (_, i) => variant(n * 100 + i + 1));
    responses.ProductCommerce = (variables: Record<string, unknown>) => {
      const index = variables.after === null ? 0 : Number(String(variables.after).replace('c', ''));
      return {
        product: {id: content.id, options, selectedVariant: variant(1), variants: page(pageOf(index), index === 20 ? null : `c${index + 1}`)},
        relatedProducts: {products: {nodes: []}},
      };
    };
    const {result} = await run('huge', responses);
    expect(result.product.variants.nodes).toHaveLength(2048);
  });

  it('reads every variant page so a product with more than 100 variants keeps its late variants', async () => {
    const first = Array.from({length: 100}, (_, i) => variant(i + 1));
    const second = Array.from({length: 50}, (_, i) => variant(i + 101));
    responses.ProductCommerce = (variables: Record<string, unknown>) =>
      variables.after === null
        ? {product: {id: content.id, options, selectedVariant: variant(1), variants: page(first, 'cursor-1')}, relatedProducts: {products: {nodes: []}}}
        : {product: {id: content.id, variants: page(second, null)}};
    const {result, calls} = await run('big', responses);
    expect(result.product.variants.nodes).toHaveLength(150);
    expect(result.product.variants.nodes.at(-1)?.id).toBe('gid://shopify/ProductVariant/150');
    const commerceCalls = calls.filter((c) => c.operationName === 'ProductCommerce');
    expect(commerceCalls).toHaveLength(2);
    // selected variant and related products are only requested with the first page
    expect(commerceCalls[0].variables.withExtras).toBe(true);
    expect(commerceCalls[1].variables).toMatchObject({after: 'cursor-1', withExtras: false});
  });

  it('keeps price and availability on a short, no-stale-if-error cache while content stays long', () => {
    const fresh = CacheFresh();
    const long = CacheLong();
    expect(fresh.maxAge).toBeLessThanOrEqual(60);
    expect(fresh.staleWhileRevalidate ?? 0).toBeLessThanOrEqual(60);
    expect(fresh.staleIfError).toBeUndefined();
    expect(long.maxAge).toBeGreaterThanOrEqual(3600);
  });

  describe('review aggregate', () => {
    let fetchSpy: ReturnType<typeof vi.spyOn>;
    const badge = (rating: string, count: string) => ({
      namespace: 'judgeme',
      key: 'badge',
      value: `<div data-average-rating='${rating}' data-number-of-reviews='${count}'></div>`,
    });

    beforeEach(() => {
      // a review fetch that never settles: the page must not wait on it when the badge is available
      fetchSpy = vi.spyOn(globalThis, 'fetch').mockImplementation(() => new Promise<Response>(() => {}));
    });
    afterEach(() => fetchSpy.mockRestore());

    it('uses the provider badge as the aggregate and does not wait on the review list', async () => {
      responses.Product = {product: {...content, metafields: [badge('4.6', '120')]}};
      const started = Date.now();
      const {result} = await run('test-product', responses);
      expect(Date.now() - started).toBeLessThan(1000);
      expect(result.reviewSummary).toEqual({rating: 4.6, count: 120});
    });

    it('ignores a badge with an out-of-range rating', async () => {
      responses.Product = {product: {...content, metafields: [badge('9.9', '120')]}};
      vi.useFakeTimers();
      try {
        const pending = run('test-product', responses);
        await vi.advanceTimersByTimeAsync(2000);
        expect((await pending).result.reviewSummary).toBeNull();
      } finally {
        vi.useRealTimers();
      }
    });
  });
});
