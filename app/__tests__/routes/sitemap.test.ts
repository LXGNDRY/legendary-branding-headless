import {describe, expect, it} from 'vitest';
import {loader} from '~/routes/[sitemap.xml]';
import {createMockStorefront} from '~/test/mock-storefront';

const connection = (handle: string) => ({nodes: [{handle, updatedAt: '2026-01-01T00:00:00Z'}], pageInfo: {hasNextPage: false, endCursor: null}});

type PolicyFixture = {native?: string[]; pages?: Record<string, string>};
const ALIASES: Record<string, string> = {
  'refund-policy': 'refund',
  'terms-of-service': 'terms',
  'privacy-with-legendary-branding': 'privacy',
  'shipping-policy': 'shipping',
  'size-guide': 'sizeGuide',
  about: 'about',
  legendary_branding_faqs: 'faq',
};
const policies = ({native = ['refundPolicy', 'termsOfService', 'shippingPolicy', 'privacyPolicy'], pages = {}}: PolicyFixture = {}) => ({
  shop: Object.fromEntries(['refundPolicy', 'termsOfService', 'shippingPolicy', 'privacyPolicy'].map((key) => [key, native.includes(key) ? {body: '<p>x</p>'} : null])),
  ...Object.fromEntries(Object.values(ALIASES).map((alias) => [alias, null])),
  ...Object.fromEntries(Object.entries(pages).map(([handle, body]) => [ALIASES[handle], {body}])),
});

function run(country: string, language: string, options: {pages?: string[]; policies?: PolicyFixture; requestUrl?: string} = {}) {
  const mock = createMockStorefront({
    responses: {
      SitemapPolicies: policies(options.policies),
      SitemapProducts: {products: connection('tee')},
      SitemapCollections: {collections: connection('all')},
      SitemapPages: {pages: {nodes: (options.pages ?? ['lookbook']).map((handle) => ({handle, updatedAt: '2026-01-01T00:00:00Z'})), pageInfo: {hasNextPage: false, endCursor: null}}},
      SitemapArticles: {blog: {articles: connection('post')}},
    },
  });
  mock.storefront.i18n = {country, language} as typeof mock.storefront.i18n;
  // @ts-expect-error - minimal Hydrogen app context
  return loader({request: new Request(options.requestUrl ?? 'https://legendary-branding.com/sitemap.xml'), context: mock.createContext(), params: {}}).then(async (res: Response) => ({
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
    expect(locs.every((loc) => loc.startsWith('https://legendary-branding.com/') || loc === 'https://legendary-branding.com')).toBe(true);
  });

  it('lists only policy URLs the route would serve: a built-in policy body or a Page body, plus contact', async () => {
    const {body} = await run('US', 'EN', {policies: {native: ['refundPolicy', 'privacyPolicy'], pages: {about: '<p>About us</p>'}}});
    expect(body).toContain('/policies/refund-policy');
    expect(body).toContain('/policies/privacy-with-legendary-branding');
    expect(body).toContain('/policies/about');
    expect(body).toContain('/policies/contact');
    // no built-in policy and no page body: would answer 503, so it must not be listed
    expect(body).not.toContain('/policies/terms-of-service');
    expect(body).not.toContain('/policies/shipping-policy');
    expect(body).not.toContain('/policies/size-guide');
    expect(body).not.toContain('/policies/legendary_branding_faqs');
  });

  it('does not list a policy whose Page exists but has an empty body (the route answers 503 for it)', async () => {
    const {body} = await run('US', 'EN', {policies: {native: [], pages: {about: '', 'size-guide': '<p>Chart</p>'}}, pages: ['about', 'size-guide']});
    expect(body).not.toContain('/policies/about');
    expect(body).toContain('/policies/size-guide');
  });

  it('lists a page-backed policy once, under /policies, never also under /pages', async () => {
    const {body} = await run('US', 'EN', {pages: ['about', 'lookbook'], policies: {pages: {about: '<p>About us</p>'}}});
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


describe('sitemap pagination integrity', () => {
  const runProducts = async (response: (variables: Record<string, unknown>) => unknown) => {
    const mock = createMockStorefront({responses: {
      SitemapPolicies: policies(),
      SitemapProducts: response,
      SitemapCollections: {collections: connection('all')},
      SitemapPages: {pages: connection('lookbook')},
      SitemapArticles: {blog: {articles: connection('post')}},
    }});
    return loader({request: new Request('https://legendary-branding.com/sitemap.xml'), context: mock.createContext(), params: {}} as never);
  };

  it('follows every cursor and deduplicates overlapping connection nodes', async () => {
    const response = await runProducts(({after}) => ({products: {
      nodes: after ? [{handle: 'tee'}, {handle: 'last'}] : [{handle: 'tee'}],
      pageInfo: {hasNextPage: !after, endCursor: after ? null : 'next'},
    }}));
    const body = await response.text();
    expect(body.match(/<loc>https:\/\/legendary-branding.com\/products\/tee<\/loc>/g)).toHaveLength(1);
    expect(body).toContain('/products/last</loc>');
  });

  it.each(['missing', 'repeated', 'limit'])('rejects a %s cursor instead of publishing a partial sitemap', async (kind) => {
    const result = runProducts(({after}) => ({products: {
      nodes: [{handle: 'tee'}],
      pageInfo: {hasNextPage: true, endCursor: kind === 'missing' ? null : kind === 'repeated' ? 'same' : `${Number(after ?? 0) + 1}`},
    }}));
    await expect(result).rejects.toMatchObject({status: 503});
  });
});
