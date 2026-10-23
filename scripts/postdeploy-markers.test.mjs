import {readFileSync} from 'node:fs';
import {spawnSync} from 'node:child_process';
import {describe, expect, it} from 'vitest';

const workflow = readFileSync('.github/workflows/oxygen-deployment-1000180490.yml', 'utf8');
const resourceTitle = workflow.match(/RESOURCE_TITLE_MARKER='([^']+)'/)?.[1] ?? workflow.match(/TITLE_MARKER='([^']+)'/)[1];
const matches = (pattern, html) => spawnSync('grep', ['-Eq', pattern], {input: html, encoding: 'utf8'}).status === 0;
const canonical = '<link rel="canonical" href="https://legendary-branding.com/collections/all-products"/>';
const schema = '<script type="application/ld+json">{"@type":"CollectionPage"}</script>';
const products = '<a href="/products/tee">Tee</a>';

describe('post-deploy resource evidence', () => {
  it('accepts a genuine merchant SEO title without requiring a brand capitalization convention', () => {
    expect(matches(resourceTitle, '<title>Heavyweight Clothing | Legendary Branding</title>')).toBe(true);
  });
  it.each(['<title></title>', '<title>   </title>', '<h1>Title only</h1>'])('rejects missing or empty document titles: %s', (html) => {
    expect(matches(resourceTitle, html)).toBe(false);
  });
  it('still requires the correct canonical, collection schema and product links together', () => {
    const line = workflow.split('\n').find((line) => line.includes('check_route "/collections/all-products"'));
    expect(line).toContain('"$RESOURCE_TITLE_MARKER"');
    const markers = [resourceTitle, ...[...line.matchAll(/'([^']+)'/g)].map((m) => m[1])];
    const valid = `<title>Merchant title</title>${canonical}${schema}${products}`;
    expect(markers.every((m) => matches(m, valid))).toBe(true);
    for (const fragment of [canonical, schema, products]) {
      expect(markers.every((m) => matches(m, valid.replace(fragment, '')))).toBe(false);
    }
  });
});
