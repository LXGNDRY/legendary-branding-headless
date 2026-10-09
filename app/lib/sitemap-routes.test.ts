import {describe, expect, it} from 'vitest';
import {loader as collectionsLoader} from '../routes/[sitemap-collections.xml]';
import {loader as indexLoader} from '../routes/[sitemap.xml]';
import {loader as journalLoader} from '../routes/[sitemap-journal.xml]';
import {loader as pagesLoader} from '../routes/[sitemap-pages.xml]';
import {loader as productsLoader} from '../routes/[sitemap-products.xml]';
import {DEFAULT_COUNTRY, DEFAULT_LANGUAGE} from './market';

// NOTE: handles a malformed or hostile API response could carry; none may reach a sitemap URL.
const HOSTILE = ['web-pixels@abc', 'a?variant=1', 'a?country=CA', 'a?currency=CAD', 'a/b', 'en-ca/x', 'account/login', '../cart', 'a#b'];
const GOOD_PRODUCTS = ['goat-hoodie-440gsm', 'tee_2'];

const conn = (nodes: unknown[]) => ({nodes, pageInfo: {hasNextPage: false, endCursor: null}});

function makeContext(seen: {country: unknown; language: unknown}[]) {
  return {
    env: {PUBLIC_CHECKOUT_DOMAIN: 'legendary-branding.com'},
    storefront: {
      // NOTE: a visitor in another market; the sitemap must ignore it.
      i18n: {country: 'CA', language: 'FR'},
      query: async (query: string, options: {variables: {country: unknown; language: unknown}}) => {
        seen.push({country: options.variables.country, language: options.variables.language});
        const bad = HOSTILE.map((handle) => ({handle}));
        if (query.includes('SitemapProducts'))
          return {products: conn([...GOOD_PRODUCTS, ...HOSTILE].map((handle) => ({handle, images: {nodes: []}})))};
        if (query.includes('SitemapCollections'))
          return {collections: conn([{handle: 'hoodies', products: {nodes: [{id: '1'}]}}, {handle: 'empty', products: {nodes: []}}, ...bad.map((b) => ({...b, products: {nodes: [{id: '1'}]}}))])};
        if (query.includes('SitemapPages')) return {pages: conn([{handle: 'about', updatedAt: '2026-01-01T00:00:00Z'}, {handle: 'the-guide', updatedAt: '2026-01-01T00:00:00Z'}, ...bad])};
        if (query.includes('SitemapArticles')) return {blog: {articles: conn([{handle: 'story', updatedAt: '2026-01-01T00:00:00Z'}, ...bad])}};
        throw new Error(`unexpected query ${query.slice(0, 40)}`);
      },
    },
  };
}

const ALLOWED = /^https:\/\/www\.legendary-branding\.com(\/|\/collections|\/journal|\/(products|collections|pages|policies|journal)\/[A-Za-z0-9][A-Za-z0-9_-]*)$/;

async function allLocs() {
  const seen: {country: unknown; language: unknown}[] = [];
  const args = {request: new Request('https://www.legendary-branding.com/sitemap.xml'), context: makeContext(seen), params: {}} as never;
  const locs: string[] = [];
  for (const loader of [pagesLoader, collectionsLoader, productsLoader, journalLoader] as ((a: never) => Response | Promise<Response>)[]) {
    const xml = await (await loader(args)).text();
    locs.push(...[...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]));
  }
  return {locs, seen};
}

describe('sitemap routes', () => {
  it('only ever emits plain https URLs under the six indexable path prefixes', async () => {
    const {locs} = await allLocs();
    expect(locs.length).toBeGreaterThan(0);
    for (const loc of locs) expect(loc).toMatch(ALLOWED);
  });

  it('never emits query strings, fragments, @ handles, auth, cart, search, account or localized paths', async () => {
    const {locs} = await allLocs();
    for (const loc of locs) {
      expect(loc).not.toMatch(/[?#@]/);
      expect(loc).not.toMatch(/\/(account|cart|checkout|search|wishlist|api|web-pixels|wpm|apps|en-[a-z]{2}|fr|de|es)(\/|$)/i);
    }
  });

  it('skips empty collections and lists each policy document once, under /policies', async () => {
    const {locs} = await allLocs();
    expect(locs).toContain('https://www.legendary-branding.com/collections/hoodies');
    expect(locs).not.toContain('https://www.legendary-branding.com/collections/empty');
    expect(locs).toContain('https://www.legendary-branding.com/policies/about');
    expect(locs).not.toContain('https://www.legendary-branding.com/pages/about');
    expect(locs).toContain('https://www.legendary-branding.com/pages/the-guide');
  });

  it('queries every sitemap in the default market, whatever the visitor sees', async () => {
    const {seen} = await allLocs();
    expect(seen.length).toBeGreaterThan(0);
    for (const variables of seen) expect(variables).toEqual({country: DEFAULT_COUNTRY, language: DEFAULT_LANGUAGE});
  });

  it('keeps the index to the four per-type sitemaps', async () => {
    const xml = await (await indexLoader({request: new Request('https://www.legendary-branding.com/sitemap.xml'), context: makeContext([]), params: {}} as never)).text();
    expect([...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1].replace('https://www.legendary-branding.com', ''))).toEqual([
      '/sitemap-pages.xml',
      '/sitemap-collections.xml',
      '/sitemap-products.xml',
      '/sitemap-journal.xml',
    ]);
  });
});
