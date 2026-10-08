import {expect, test} from '@playwright/test';

// NOTE: a robots.txt that blocks the wrong paths (or all of them) silently
// removes the storefront from search, so check what the running worker serves.
test.describe('robots.txt', () => {
  test('is served as plain text with the expected rules', async ({request}) => {
    const response = await request.get('/robots.txt');

    expect(response.status()).toBe(200);
    expect(response.headers()['content-type']).toContain('text/plain');
    const body = await response.text();
    expect(body).toContain('User-agent: *');
    expect(body).toContain('Disallow: /cart');
    expect(body).toContain('Disallow: /search');
    expect(body).toMatch(/Sitemap: https?:\/\/\S+\/sitemap\.xml/);
    expect(body).not.toMatch(/^Disallow: \/$/m);
  });
});
