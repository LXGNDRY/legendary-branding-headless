import {expect, test} from '@playwright/test';

const CHILDREN = ['/sitemap-pages.xml', '/sitemap-collections.xml', '/sitemap-products.xml', '/sitemap-journal.xml'];
const POLICY_HANDLES = [
  'refund-policy',
  'terms-of-service',
  'privacy-with-legendary-branding',
  'shipping-policy',
  'size-guide',
  'about',
  'contact',
  'legendary_branding_faqs',
];

test.describe('sitemap', () => {
  test('the index lists the per-type sitemaps', async ({request}) => {
    const response = await request.get('/sitemap.xml');
    expect(response.status()).toBe(200);
    expect(response.headers()['content-type']).toContain('xml');
    const body = await response.text();
    expect(body).toContain('<sitemapindex');
    for (const child of CHILDREN) expect(body).toContain(`${child}</loc>`);
  });

  test('every child is a urlset of absolute URLs on one host', async ({request}) => {
    for (const child of CHILDREN) {
      const response = await request.get(child);
      expect(response.status(), child).toBe(200);
      const body = await response.text();
      expect(body, child).toContain('<urlset');
      const locs = [...body.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
      expect(locs.length, child).toBeGreaterThan(0);
      // NOTE: the host is https://www.<PUBLIC_CHECKOUT_DOMAIN> in production and the request origin when that variable is unset (CI preview).
      for (const loc of locs) expect(loc, child).toMatch(/^https?:\/\//);
      expect(new Set(locs.map((loc) => new URL(loc).host)).size, child).toBe(1);
    }
  });

  test('products carry images and no lastmod', async ({request}) => {
    const body = await (await request.get('/sitemap-products.xml')).text();
    expect(body).toContain('<image:image>');
    expect(body).not.toContain('<lastmod>');
  });

  test('policy documents are listed once, under /policies', async ({request}) => {
    const body = await (await request.get('/sitemap-pages.xml')).text();
    for (const handle of POLICY_HANDLES) expect(body).not.toContain(`/pages/${handle}<`);
  });
});
