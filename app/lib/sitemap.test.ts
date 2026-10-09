import {describe, expect, it} from 'vitest';
import {escapeXml, sitemapIndexXml, urlEntry, urlsetXml} from './sitemap';

const ORIGIN = 'https://www.legendary-branding.com';

describe('sitemap helpers', () => {
  it('escapes XML special characters', () => {
    expect(escapeXml(`a&b<c>"d"'e'`)).toBe('a&amp;b&lt;c&gt;&quot;d&quot;&apos;e&apos;');
  });

  it('writes only loc when no reliable lastmod is given', () => {
    const entry = urlEntry(ORIGIN, '/products/x');
    expect(entry).toContain('<loc>https://www.legendary-branding.com/products/x</loc>');
    expect(entry).not.toContain('lastmod');
  });

  it('adds lastmod when given, and never the fields Google ignores', () => {
    const entry = urlEntry(ORIGIN, '/pages/about', '2026-10-01T00:00:00Z');
    expect(entry).toContain('<lastmod>2026-10-01T00:00:00Z</lastmod>');
    expect(entry).not.toMatch(/priority|changefreq/);
  });

  it('lists product images, escaped and capped at eight', () => {
    const images = Array.from({length: 10}, (_, i) => `https://cdn.shopify.com/s/files/${i}.jpg?v=1&width=2000`);
    const entry = urlEntry(ORIGIN, '/products/x', undefined, images);
    expect(entry.match(/<image:image>/g)).toHaveLength(8);
    expect(entry).toContain('<image:loc>https://cdn.shopify.com/s/files/0.jpg?v=1&amp;width=2000</image:loc>');
  });

  it('declares the image namespace only when an entry has images', () => {
    expect(urlsetXml([urlEntry(ORIGIN, '/')])).not.toContain('xmlns:image');
    expect(urlsetXml([urlEntry(ORIGIN, '/products/x', undefined, ['https://cdn.shopify.com/a.jpg'])])).toContain(
      'xmlns:image="http://www.google.com/schemas/sitemap-image/1.1"',
    );
  });

  it('builds a sitemap index of absolute child sitemap URLs', () => {
    const xml = sitemapIndexXml(ORIGIN, ['/sitemap-products.xml', '/sitemap-pages.xml']);
    expect(xml).toContain('<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">');
    expect(xml).toContain('<loc>https://www.legendary-branding.com/sitemap-products.xml</loc>');
    expect(xml).toContain('<loc>https://www.legendary-branding.com/sitemap-pages.xml</loc>');
  });
});
