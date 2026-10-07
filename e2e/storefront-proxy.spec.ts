import {expect, test} from '@playwright/test';

// NOTE: Hydrogen's consent/analytics (useCustomerPrivacy) only talk to Shopify
// through this same-origin proxy, which exists only when server.ts uses
// Hydrogen's createRequestHandler. If it 404s, consent and analytics silently
// stop loading in production.
test.describe('Storefront API same-origin proxy', () => {
  test('forwards GraphQL requests to Shopify', async ({request}) => {
    const response = await request.post('/api/unstable/graphql.json', {
      data: {query: '{ shop { name } }'},
    });

    expect(response.status()).toBe(200);
    expect(response.headers()['content-type']).toContain('application/json');
    const body = (await response.json()) as {data?: unknown; errors?: unknown};
    expect(body.data ?? body.errors).toBeDefined();
  });
});
