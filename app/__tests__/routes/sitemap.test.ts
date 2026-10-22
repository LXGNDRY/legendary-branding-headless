import {describe, expect, it} from 'vitest';
import {loader} from '~/routes/[sitemap.xml]';
import {createMockStorefront} from '~/test/mock-storefront';

const connection = (handle: string) => ({nodes: [{handle, updatedAt: '2026-01-01T00:00:00Z'}], pageInfo: {hasNextPage: false, endCursor: null}});

function run(country: string, language: string) {
  const mock = createMockStorefront({
    responses: {
      SitemapProducts: {products: connection('tee')},
      SitemapCollections: {collections: connection('all')},
      SitemapPages: {pages: connection('lookbook')},
      SitemapArticles: {blog: {articles: connection('post')}},
    },
  });
  mock.storefront.i18n = {country, language} as typeof mock.storefront.i18n;
  // @ts-expect-error - minimal Hydrogen app context
  return loader({request: new Request('https://www.legendary-branding.com/sitemap.xml'), context: mock.createContext(), params: {}}).then(async (res: Response) => ({
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
});
