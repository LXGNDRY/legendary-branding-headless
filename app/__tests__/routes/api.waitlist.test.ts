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

  const soldOutVariant = {
    node: {__typename: 'ProductVariant', id: 'gid://shopify/ProductVariant/456', availableForSale: false, product: {id: 'gid://shopify/Product/123'}},
  };

  async function submit(request: Request, env: Record<string, string> = {}, node: unknown = soldOutVariant) {
    const context = createMockStorefront({responses: {WaitlistVariant: node}}).createContext({env});
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
  const configured = {PRIVATE_KLAVIYO_API_KEY: 'test-key'};

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

  it('rejects malformed product or variant IDs without contacting Klaviyo', async () => {
    for (const bad of [{variantId: '456'}, {variantId: 'gid://shopify/Product/456'}, {productId: 'gid://shopify/ProductVariant/1'}, {variantId: 'gid://shopify/ProductVariant/1; drop'}]) {
      const response = await submit(makeRequest({...validFields, ...bad}), configured);
      expect(response.status).toBe(400);
    }
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('rejects a variant that does not exist or belongs to another product', async () => {
    const missing = await submit(makeRequest(validFields), configured, {node: null});
    expect(missing.status).toBe(404);
    const other = await submit(makeRequest(validFields), configured, {
      node: {...soldOutVariant.node, product: {id: 'gid://shopify/Product/999'}},
    });
    expect(other.status).toBe(404);
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('refuses a restock request for a variant that is in stock', async () => {
    const response = await submit(makeRequest(validFields), configured, {
      node: {...soldOutVariant.node, availableForSale: true},
    });
    expect(response.status).toBe(409);
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('registers a per-variant restock request with a normalized email', async () => {
    fetchSpy.mockResolvedValueOnce(new Response(null, {status: 202}));
    const response = await submit(makeRequest({...validFields, email: ' Shopper@Example.com '}), configured);
    const [url, init] = fetchSpy.mock.calls[0];
    const payload = JSON.parse(String(init?.body));

    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({success: true, message: expect.stringMatching(/received/i)});
    expect(url).toBe('https://a.klaviyo.com/api/back-in-stock-subscriptions/');
    expect(payload.data.attributes.profile.data.attributes.email).toBe('shopper@example.com');
    expect(payload.data.relationships.variant.data.id).toBe('$shopify:::$default:::456');
  });

  it('keeps two variants as independent requests for the same address', async () => {
    fetchSpy.mockResolvedValue(new Response(null, {status: 202}));
    const second = {
      node: {...soldOutVariant.node, id: 'gid://shopify/ProductVariant/789'},
    };
    await submit(makeRequest(validFields), configured);
    await submit(makeRequest({...validFields, variantId: 'gid://shopify/ProductVariant/789'}), configured, second);
    const ids = fetchSpy.mock.calls.map((call) => JSON.parse(String(call[1]?.body)).data.relationships.variant.data.id);
    expect(ids).toEqual(['$shopify:::$default:::456', '$shopify:::$default:::789']);
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
