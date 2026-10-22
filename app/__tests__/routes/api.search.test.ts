import {describe, expect, it} from 'vitest';
import {loader as searchLoader} from '~/routes/api.search';
import {loader as quickAddLoader} from '~/routes/api.quick-add';
import {createMockStorefront} from '~/test/mock-storefront';

let ip = 0;
function get(path: string) {
  ip += 1;
  return new Request(`http://localhost${path}`, {headers: {'X-Forwarded-For': `203.0.113.${ip}`}});
}

function contextFor(country: string, language: string, responses: Record<string, unknown>) {
  const mock = createMockStorefront({responses});
  mock.storefront.i18n = {country, language} as typeof mock.storefront.i18n;
  return {context: mock.createContext(), calls: mock.getCalls};
}

const predictive = {
  predictiveSearch: {
    products: [{id: 'p1', title: 'Tee', handle: 'tee', priceRange: {minVariantPrice: {amount: '10', currencyCode: 'EUR'}}}],
    collections: [],
    queries: [],
  },
};

describe('api.search cache isolation', () => {
  it('sends the active market to Shopify and never allows a shared cache for results', async () => {
    const es = contextFor('ES', 'ES', {PredictiveSearch: predictive});
    const us = contextFor('US', 'EN', {PredictiveSearch: predictive});
    // @ts-expect-error - minimal Hydrogen app context
    const esRes = await searchLoader({request: get('/api/search?q=tee'), context: es.context, params: {}});
    // @ts-expect-error - minimal Hydrogen app context
    const usRes = await searchLoader({request: get('/api/search?q=tee'), context: us.context, params: {}});

    expect(es.calls()[0].variables).toMatchObject({country: 'ES', language: 'ES'});
    expect(us.calls()[0].variables).toMatchObject({country: 'US', language: 'EN'});
    for (const res of [esRes, usRes]) {
      const cache = res.headers.get('Cache-Control') ?? '';
      expect(cache).toContain('private');
      expect(cache).not.toContain('public');
    }
  });

  it('never caches an upstream failure', async () => {
    const {context} = contextFor('US', 'EN', {});
    // @ts-expect-error - minimal Hydrogen app context
    const res = await searchLoader({request: get('/api/search?q=tee'), context, params: {}});
    expect(res.status).toBe(500);
    expect(res.headers.get('Cache-Control')).toBe('no-store');
  });

  it('keeps short queries private too', async () => {
    const {context} = contextFor('US', 'EN', {});
    // @ts-expect-error - minimal Hydrogen app context
    const res = await searchLoader({request: get('/api/search?q=t'), context, params: {}});
    expect(res.headers.get('Cache-Control')).toBe('private, max-age=60');
  });
});

describe('api.quick-add cache isolation', () => {
  const product = {product: {id: 'p1', title: 'Tee', handle: 'tee', options: [], variants: {nodes: [], pageInfo: {hasNextPage: false, endCursor: null}}}};

  it('is private on success and uncached for missing, invalid and failed requests', async () => {
    const ok = contextFor('US', 'EN', {QuickAddProduct: product});
    // @ts-expect-error - minimal Hydrogen app context
    const okRes = await quickAddLoader({request: get('/api/quick-add?handle=tee'), context: ok.context, params: {}});
    expect(okRes.headers.get('Cache-Control')).toBe('private, max-age=60');

    const missing = contextFor('US', 'EN', {QuickAddProduct: {product: null}});
    // @ts-expect-error - minimal Hydrogen app context
    const missingRes = await quickAddLoader({request: get('/api/quick-add?handle=nope'), context: missing.context, params: {}});
    expect(missingRes.status).toBe(404);
    expect(missingRes.headers.get('Cache-Control')).toBe('no-store');

    // @ts-expect-error - minimal Hydrogen app context
    const badRes = await quickAddLoader({request: get('/api/quick-add'), context: ok.context, params: {}});
    expect(badRes.status).toBe(400);
    expect(badRes.headers.get('Cache-Control')).toBe('no-store');

    const broken = contextFor('US', 'EN', {});
    // @ts-expect-error - minimal Hydrogen app context
    const brokenRes = await quickAddLoader({request: get('/api/quick-add?handle=tee'), context: broken.context, params: {}});
    expect(brokenRes.status).toBe(500);
    expect(brokenRes.headers.get('Cache-Control')).toBe('no-store');
  });
});

describe('api.quick-add variant pagination', () => {
  const variant = (n: number) => ({id: `gid://shopify/ProductVariant/${n}`, availableForSale: true, selectedOptions: [], price: {amount: '1', currencyCode: 'USD'}});

  it('returns every variant of a product with more than 100 variants', async () => {
    const respond = (variables: Record<string, unknown>) =>
      variables.after === null
        ? {product: {id: 'p1', title: 'Tee', handle: 'big', options: [], variants: {nodes: Array.from({length: 100}, (_, i) => variant(i + 1)), pageInfo: {hasNextPage: true, endCursor: 'c1'}}}}
        : {product: {id: 'p1', variants: {nodes: Array.from({length: 20}, (_, i) => variant(i + 101)), pageInfo: {hasNextPage: false, endCursor: null}}}};
    const {context, calls} = contextFor('US', 'EN', {QuickAddProduct: respond});
    // @ts-expect-error - minimal Hydrogen app context
    const res = await quickAddLoader({request: get('/api/quick-add?handle=big'), context, params: {}});
    const body = await res.json();
    expect(body.product.title).toBe('Tee');
    expect(body.product.variants.nodes).toHaveLength(120);
    expect(calls()).toHaveLength(2);
  });
});
