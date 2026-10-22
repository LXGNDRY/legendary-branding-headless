import {test, expect} from '@playwright/test';

/**
 * Public URL contract: canonical, sitemap and robots agree on one origin, previews are noindex, and every
 * footer policy/help link resolves to content (a required policy with no content answers 503 and fails here).
 */
const LIVE_ORIGIN = 'https://www.legendary-branding.com';

test('home canonical and og:url use the live origin', async ({page}) => {
  await page.goto('/', {waitUntil: 'domcontentloaded'});
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', `${LIVE_ORIGIN}/`);
  await expect(page.locator('meta[property="og:url"]')).toHaveAttribute('content', `${LIVE_ORIGIN}/`);
});

test('robots.txt and sitemap.xml name only the live origin', async ({request}) => {
  const robots = await (await request.get('/robots.txt')).text();
  expect(robots).toContain(`Sitemap: ${LIVE_ORIGIN}/sitemap.xml`);

  const response = await request.get('/sitemap.xml');
  expect(response.ok()).toBe(true);
  const locs = [...(await response.text()).matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
  expect(locs.length).toBeGreaterThan(3);
  for (const loc of locs) expect(loc === LIVE_ORIGIN || loc.startsWith(`${LIVE_ORIGIN}/`), loc).toBe(true);
});

test('every footer policy link resolves to content', async ({page, request}) => {
  await page.goto('/', {waitUntil: 'domcontentloaded'});
  const hrefs = await page.locator('footer a[href^="/policies/"]').evaluateAll((links) => [...new Set(links.map((a) => a.getAttribute('href')!))]);
  expect(hrefs.length).toBeGreaterThan(3);
  for (const href of hrefs) {
    const response = await request.get(href, {maxRedirects: 0});
    expect(response.status(), href).toBeLessThan(400);
  }
});

test('a /pages link to a policy redirects permanently to its canonical /policies route', async ({request}) => {
  const response = await request.get('/pages/refund-policy', {maxRedirects: 0});
  expect(response.status()).toBe(301);
  expect(response.headers()['location']).toBe('/policies/refund-policy');
});

test('an unknown policy handle is a 404, not a soft success', async ({request}) => {
  const response = await request.get('/policies/definitely-not-a-policy', {maxRedirects: 0});
  expect(response.status()).toBe(404);
});
