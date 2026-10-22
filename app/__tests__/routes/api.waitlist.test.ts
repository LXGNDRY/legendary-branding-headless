import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest';
import {action, loader} from '~/routes/api.waitlist';
import {createMockStorefront} from '~/test/mock-storefront';

describe('api.waitlist action', () => {
  let fetchSpy: ReturnType<typeof vi.spyOn>;
  let requestNumber = 0;

  beforeEach(() => {
    fetchSpy = vi.spyOn(globalThis, 'fetch');
  });

  afterEach(() => {
    fetchSpy.mockRestore();
  });

  function makeRequest(values: Record<string, string>, origin = 'http://localhost') {
    requestNumber += 1;
    const body = new FormData();
    for (const [key, value] of Object.entries(values)) body.set(key, value);
    return new Request('http://localhost/api/waitlist', {
      method: 'POST',
      headers: {
        Origin: origin,
        'X-Forwarded-For': `198.51.100.${requestNumber}`,
      },
      body,
    });
  }

  async function submit(request: Request, env: Record<string, string> = {}) {
    const context = createMockStorefront().createContext({env});
    // @ts-expect-error - minimal Hydrogen app context for this action
    return action({request, context, params: {}});
  }

  const validFields = {
    email: 'shopper@example.com',
    productId: 'gid://shopify/Product/123',
    variantId: 'gid://shopify/ProductVariant/456',
    productTitle: 'Heavyweight Hoodie',
    variantTitle: 'Black / Large',
  };
  const configured = {
    PRIVATE_KLAVIYO_API_KEY: 'test-key',
    PUBLIC_KLAVIYO_WAITLIST_LIST_ID: 'waitlist-test-list',
  };

  it('rejects non-POST requests', async () => {
    const response = await submit(new Request('http://localhost/api/waitlist'));

    expect(response.status).toBe(405);
  });

  it('rejects a different origin without contacting Klaviyo', async () => {
    const response = await submit(
      makeRequest(validFields, 'https://attacker.example'),
      configured,
    );

    expect(response.status).toBe(403);
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('rejects an invalid email', async () => {
    const response = await submit(
      makeRequest({...validFields, email: 'invalid'}),
      configured,
    );

    expect(response.status).toBe(400);
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('requires both a product and variant', async () => {
    const response = await submit(
      makeRequest({...validFields, variantId: ''}),
      configured,
    );

    expect(response.status).toBe(400);
    expect(await response.json()).toMatchObject({error: expect.stringMatching(/product and variant/i)});
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('returns unavailable when Klaviyo is not configured', async () => {
    const response = await submit(makeRequest(validFields));

    expect(response.status).toBe(503);
    expect(await response.json()).toMatchObject({error: expect.stringMatching(/temporarily unavailable/i)});
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('sends the sanitized product and variant details to the waitlist', async () => {
    fetchSpy.mockResolvedValueOnce(new Response(null, {status: 202}));
    const response = await submit(
      makeRequest({...validFields, email: ' Shopper@Example.com ', productTitle: ' Hoodie\u0000'}),
      configured,
    );
    const payload = JSON.parse(String(fetchSpy.mock.calls[0][1]?.body));

    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({success: true});
    expect(payload.data.relationships.list.data.id).toBe('waitlist-test-list');
    expect(payload.included[0].attributes.email).toBe('shopper@example.com');
    expect(payload.included[0].attributes.properties).toMatchObject({
      waitlist_product_id: validFields.productId,
      waitlist_variant_id: validFields.variantId,
      waitlist_product_title: 'Hoodie',
      waitlist_variant_title: validFields.variantTitle,
      waitlist_country: 'US',
    });
  });

  it('returns a gateway error when Klaviyo rejects the request', async () => {
    fetchSpy.mockResolvedValueOnce(new Response('upstream failure', {status: 500}));
    const response = await submit(makeRequest(validFields), configured);

    expect(response.status).toBe(502);
    expect(await response.json()).toMatchObject({error: expect.stringMatching(/try again/i)});
  });

  it('returns a gateway error when the Klaviyo request fails on the network', async () => {
    fetchSpy.mockRejectedValueOnce(new Error('network failure'));
    const response = await submit(makeRequest(validFields), configured);

    expect(response.status).toBe(502);
    expect(await response.json()).toMatchObject({error: expect.stringMatching(/try again/i)});
  });
});

describe('api.waitlist loader', () => {
  it('rejects GET requests', () => {
    const response = loader({} as never);

    expect(response.status).toBe(405);
  });
});
