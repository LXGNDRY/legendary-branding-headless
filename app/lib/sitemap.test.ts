import {describe, expect, it} from 'vitest';
import {escapeXml, urlEntry} from './sitemap';

describe('sitemap helpers', () => {
  it('escapes XML special characters', () => {
    expect(escapeXml(`a&b<c>"d"'e'`)).toBe('a&amp;b&lt;c&gt;&quot;d&quot;&apos;e&apos;');
  });

  it('writes only loc when no reliable lastmod is given', () => {
    const entry = urlEntry('https://www.legendary-branding.com', '/products/x');
    expect(entry).toContain('<loc>https://www.legendary-branding.com/products/x</loc>');
    expect(entry).not.toContain('lastmod');
  });

  it('adds lastmod when given, and never the fields Google ignores', () => {
    const entry = urlEntry('https://www.legendary-branding.com', '/pages/about', '2026-10-01T00:00:00Z');
    expect(entry).toContain('<lastmod>2026-10-01T00:00:00Z</lastmod>');
    expect(entry).not.toMatch(/priority|changefreq/);
  });
});
