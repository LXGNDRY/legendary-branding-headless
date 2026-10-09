import {describe, expect, it} from 'vitest';
import {DEFAULT_COUNTRY, DEFAULT_LANGUAGE} from './market';
import {isSafeHandle, paginate, sitemapOrigin, sitemapVariables} from './sitemap-data';

describe('sitemap data helpers', () => {
  it('pins the sitemap queries to the default market, not the visitor', () => {
    expect(sitemapVariables(100)).toEqual({country: DEFAULT_COUNTRY, language: DEFAULT_LANGUAGE, first: 100});
  });

  it('puts the www host on the checkout domain, or falls back to the request origin', () => {
    const request = new Request('http://127.0.0.1:3000/sitemap.xml');
    expect(sitemapOrigin({PUBLIC_CHECKOUT_DOMAIN: 'legendary-branding.com'} as never, request)).toBe('https://www.legendary-branding.com');
    expect(sitemapOrigin({PUBLIC_CHECKOUT_DOMAIN: 'www.legendary-branding.com'} as never, request)).toBe('https://www.legendary-branding.com');
    expect(sitemapOrigin({} as never, request)).toBe('http://127.0.0.1:3000');
  });

  it('only accepts plain handles', () => {
    for (const handle of ['x', 'goat-hoodie-440gsm', 'legendary_branding_faqs', '350gsm-cotton-blend-sweatpants']) {
      expect(isSafeHandle(handle), handle).toBe(true);
    }
    for (const handle of ['a?variant=1', 'a/b', 'web-pixels@abc', 'a b', '', '-a', 'a#b', '../x', 'a.json']) {
      expect(isSafeHandle(handle), handle).toBe(false);
    }
  });

  it('drops API nodes whose handle would make a parameterized or malformed URL', async () => {
    const nodes = await paginate(async () => ({
      nodes: [{handle: 'ok'}, {handle: 'a?variant=1'}, {handle: 'a/b'}, {handle: 'fine_2'}],
      pageInfo: {hasNextPage: false},
    }));
    expect(nodes.map((node) => node.handle)).toEqual(['ok', 'fine_2']);
  });
});
