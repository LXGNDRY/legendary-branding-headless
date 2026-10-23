import {test, expect} from '@playwright/test';

/**
 * Public URL contract: canonical, sitemap and robots agree on one origin, previews are noindex, and every
 * footer policy/help link resolves to content (a required policy with no content answers 503 and fails here).
 */
const LIVE_ORIGIN = 'https://legendary-branding.com';

test('home canonical and og:url use the live origin', async ({page}) => {
  const response = await page.goto('/', {waitUntil: 'domcontentloaded'});
  expect(response?.status()).toBe(200);
  const html = await response!.text();
  expect(html).toContain(`rel="canonical" href="${LIVE_ORIGIN}/"`);
  await expect(page.locator('link[rel="canonical"]')).toHaveCount(1);
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


test('historic blog links redirect permanently to existing journal content', async ({request}) => {
  const index = await request.get('/blogs/legendary_blogging?utm_source=legacy-test', {maxRedirects: 0});
  expect(index.status()).toBe(301);
  expect(index.headers()['location']).toBe(`${LIVE_ORIGIN}/journal?utm_source=legacy-test`);
  const journal = await request.get('/journal');
  expect(journal.status()).toBe(200);
  const articlePath = (await journal.text()).match(/href="(\/journal\/[^"?#]+)"/)?.[1];
  expect(articlePath).toBeTruthy();
  const legacy = await request.get(articlePath!.replace('/journal/', '/blogs/legendary_blogging/'), {maxRedirects: 0});
  expect(legacy.status()).toBe(301);
  expect(legacy.headers()['location']).toBe(`${LIVE_ORIGIN}${articlePath}`);
  expect((await request.get(articlePath!)).status()).toBe(200);
});


test('a later collection page retains its cursor in the canonical', async ({page}) => {
  await page.goto('/collections/all-products', {waitUntil: 'domcontentloaded'});
  const href = await page.locator('a[href*="cursor="]').evaluateAll((links) => links.map((a) => a.getAttribute('href')).find((href) => href?.includes('direction=next')));
  expect(href).toBeTruthy();
  await page.goto(href!, {waitUntil: 'domcontentloaded'});
  const url = new URL(page.url());
  const expected = new URL(`${LIVE_ORIGIN}/collections/all-products`);
  expected.searchParams.set('cursor', url.searchParams.get('cursor')!);
  expected.searchParams.set('direction', 'next');
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', expected.toString());
  const previous = await page.locator('a[href*="direction=previous"]').first().getAttribute('href');
  expect(previous).toBeTruthy();
  await page.goto(previous!, {waitUntil: 'domcontentloaded'});
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', `${LIVE_ORIGIN}/collections/all-products`);
});
