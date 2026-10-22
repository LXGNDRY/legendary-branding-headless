import {test, expect} from '@playwright/test';

/**
 * Private-route contract: account and cart responses are uncacheable and unindexable, including the error
 * and redirect responses an unconfigured environment produces (no Customer Account API credentials in CI).
 */
const PRIVATE_PATHS = ['/account', '/account/orders', '/account/addresses', '/account/edit', '/account/login', '/cart'];

for (const path of PRIVATE_PATHS) {
  test(`${path} is private, no-store and noindex on every response`, async ({request}) => {
    const response = await request.get(path, {maxRedirects: 0});
    expect(response.headers()['cache-control']).toBe('private, no-store');
    expect(response.headers()['x-robots-tag']).toBe('noindex, nofollow');
  });
}

test('a GET to logout never signs anyone out (it only redirects to the account page)', async ({request}) => {
  const response = await request.get('/account/logout', {maxRedirects: 0});
  expect(response.status()).toBe(302);
  expect(response.headers()['location']).toBe('/account');
});

test('public pages are not marked noindex or no-store', async ({request}) => {
  const response = await request.get('/', {maxRedirects: 0});
  expect(response.headers()['x-robots-tag']).toBeUndefined();
  expect(response.headers()['cache-control'] ?? '').not.toContain('no-store');
});
