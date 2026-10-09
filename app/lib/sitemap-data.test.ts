import {describe, expect, it} from 'vitest';
import {DEFAULT_COUNTRY, DEFAULT_LANGUAGE} from './market';
import {sitemapOrigin, sitemapVariables} from './sitemap-data';

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
});
