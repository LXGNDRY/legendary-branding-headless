import {describe, expect, it} from 'vitest';
import {escapeXml, localizedUrlEntries, urlEntry} from './sitemap';

const ORIGIN = 'https://legendary-branding.com';

describe('sitemap helpers', () => {
  it('escapes XML special characters', () => {
    expect(escapeXml(`a&b<c>"d"'e'`)).toBe('a&amp;b&lt;c&gt;&quot;d&quot;&apos;e&apos;');
  });

  it('writes only loc when no reliable lastmod is given', () => {
    const entry = urlEntry(ORIGIN, '/products/x');
    expect(entry).toContain('<loc>https://legendary-branding.com/products/x</loc>');
    expect(entry).not.toContain('lastmod');
  });

  it('adds lastmod when given, and never the fields Google ignores', () => {
    const entry = urlEntry(ORIGIN, '/pages/about', '2026-10-01T00:00:00Z');
    expect(entry).toContain('<lastmod>2026-10-01T00:00:00Z</lastmod>');
    expect(entry).not.toMatch(/priority|changefreq/);
  });
});

describe('localizedUrlEntries (SEO-07)', () => {
  it('emits one <url> block per enabled language', () => {
    const xml = localizedUrlEntries(ORIGIN, '/products/x');
    const blocks = xml.match(/<url>/g) ?? [];
    // 8 languages: EN, DE, ES, FR, HI, ID, IT, PT_BR
    expect(blocks).toHaveLength(8);
    expect(xml).toContain('<loc>https://legendary-branding.com/products/x</loc>');
    expect(xml).toContain('<loc>https://legendary-branding.com/de/products/x</loc>');
    expect(xml).toContain('<loc>https://legendary-branding.com/pt-br/products/x</loc>');
  });

  it('attaches reciprocal xhtml:link alternates for every supported locale plus x-default to each block', () => {
    const xml = localizedUrlEntries(ORIGIN, '/products/x');
    const perBlock = ['en', 'de', 'es', 'fr', 'hi', 'id', 'it', 'pt-BR', 'x-default'];
    for (const lang of perBlock) {
      // The language appears in every block (8 blocks), as a hreflang attribute value.
      const occurrences = xml.match(new RegExp(`hreflang="${lang}"`, 'g')) ?? [];
      expect(occurrences.length).toBeGreaterThanOrEqual(8);
    }
  });

  it('places x-default on the EN URL for every block', () => {
    const xml = localizedUrlEntries(ORIGIN, '/journal/foo');
    const defaults = xml.match(/hreflang="x-default" href="https:\/\/legendary-branding\.com\/journal\/foo"/g) ?? [];
    expect(defaults.length).toBe(8);
  });

  it('writes lastmod inside every language block when given', () => {
    const xml = localizedUrlEntries(ORIGIN, '/pages/about', '2026-10-01T00:00:00Z');
    const lastmods = xml.match(/<lastmod>2026-10-01T00:00:00Z<\/lastmod>/g) ?? [];
    expect(lastmods.length).toBe(8);
  });

  it('maps / to /de (no trailing slash) and keeps / for EN', () => {
    const xml = localizedUrlEntries(ORIGIN, '/');
    expect(xml).toContain('<loc>https://legendary-branding.com/</loc>');
    expect(xml).toContain('<loc>https://legendary-branding.com/de</loc>');
    expect(xml).toContain('<loc>https://legendary-branding.com/pt-br</loc>');
  });

  it('XML-escapes URLs that happen to contain reserved characters', () => {
    const xml = localizedUrlEntries(ORIGIN, '/products/a&b');
    expect(xml).toContain('<loc>https://legendary-branding.com/products/a&amp;b</loc>');
    expect(xml).toContain('<loc>https://legendary-branding.com/de/products/a&amp;b</loc>');
  });
});
