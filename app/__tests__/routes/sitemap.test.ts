import {describe, expect, it} from 'vitest';
import {loader} from '~/routes/[sitemap.xml]';
import {createMockStorefront} from '~/test/mock-storefront';

const connection = (handle: string) => ({nodes: [{handle, updatedAt: '2026-01-01T00:00:00Z'}], pageInfo: {hasNextPage: false, endCursor: null}});

const policies = (present: string[] = ['refundPolicy', 'termsOfService', 'shippingPolicy', 'privacyPolicy']) => ({
  shop: Object.fromEntries(['refundPolicy', 'termsOfService', 'shippingPolicy', 'privacyPolicy'].map((key) => [key, present.includes(key) ? {id: key} : null])),
});

function run(country: string, language: string, options: {pages?: string[]; policies?: ReturnType<typeof policies>; requestUrl?: string} = {}) {
  const mock = createMockStorefront({
    responses: {
      SitemapPolicies: options.policies ?? policies(),
      SitemapProducts: {products: connection('tee')},
      SitemapCollections: {collections: connection('all')},
      SitemapPages: {pages: {nodes: (options.pages ?? ['lookbook']).map((handle) => ({handle, updatedAt: '2026-01-01T00:00:00Z'})), pageInfo: {hasNextPage: false, endCursor: null}}},
      SitemapArticles: {blog: {articles: connection('post')}},
    },
  });
  mock.storefront.i18n = {country, language} as typeof mock.storefront.i18n;
  // @ts-expect-error - minimal Hydrogen app context
  return loader({request: new Request(options.requestUrl ?? 'https://www.legendary-branding.com/sitemap.xml'), context: mock.createContext(), params: {}}).then(async (res: Response) => ({
    res,
    body: await res.text(),
    calls: mock.getCalls(),
  }));
}

describe('sitemap.xml', () => {
  it('is identical for every market and never sends market context to Shopify', async () => {
    const es = await run('ES', 'ES');
    const us = await run('US', 'EN');
    expect(es.body).toBe(us.body);
    for (const call of [...es.calls, ...us.calls]) {
      expect(call.query).not.toContain('@inContext');
      expect(call.variables).not.toHaveProperty('country');
      expect(call.variables).not.toHaveProperty('language');
    }
  });

  it('lists canonical URLs and keeps its public cache because the content is market-independent', async () => {
    const {res, body} = await run('US', 'EN');
    expect(res.headers.get('Cache-Control')).toContain('public');
    expect(body).toContain('/products/tee');
    expect(body).toContain('/collections/all');
    expect(body).toContain('/journal/post');
  });

  it('always uses the canonical public origin, whatever host served the request', async () => {
    const {body} = await run('US', 'EN', {requestUrl: 'https://legendary-abc.o2.myshopify.dev/sitemap.xml'});
    const locs = [...body.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
    expect(locs.length).toBeGreaterThan(5);
    expect(locs.every((loc) => loc.startsWith('https://www.legendary-branding.com/') || loc === 'https://www.legendary-branding.com')).toBe(true);
  });

  it('lists only policy URLs that serve content: built-in policy or a page of that handle, plus contact', async () => {
    const {body} = await run('US', 'EN', {policies: policies(['refundPolicy', 'privacyPolicy']), pages: ['about', 'lookbook']});
    expect(body).toContain('/policies/refund-policy');
    expect(body).toContain('/policies/privacy-with-legendary-branding');
    expect(body).toContain('/policies/about');
    expect(body).toContain('/policies/contact');
    // no built-in policy and no page: would answer 503, so it must not be listed
    expect(body).not.toContain('/policies/terms-of-service');
    expect(body).not.toContain('/policies/shipping-policy');
    expect(body).not.toContain('/policies/size-guide');
    expect(body).not.toContain('/policies/legendary_branding_faqs');
  });

  it('lists a page-backed policy once, under /policies, never also under /pages', async () => {
    const {body} = await run('US', 'EN', {pages: ['about', 'lookbook']});
    expect(body).toContain('/policies/about');
    expect(body).not.toContain('/pages/about');
    expect(body).toContain('/pages/lookbook');
  });

  it('gives articles no lastmod, because the API only exposes the publish date', async () => {
    const {body} = await run('US', 'EN');
    const article = body.match(/<url>\s*<loc>[^<]*\/journal\/post<\/loc>[\s\S]*?<\/url>/)?.[0] ?? '';
    expect(article).toContain('/journal/post');
    expect(article).not.toContain('lastmod');
  });
});
