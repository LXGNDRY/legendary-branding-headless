import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest';
import {requestKlaviyoBackInStock, subscribeToKlaviyoList} from '~/lib/klaviyo';

describe('subscribeToKlaviyoList', () => {
  let fetchSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    fetchSpy = vi.spyOn(globalThis, 'fetch');
  });

  afterEach(() => {
    fetchSpy.mockRestore();
  });

  const input = {
    apiKey: 'test-key',
    listId: 'test-list',
    email: 'shopper@example.com',
    source: 'website',
  };

  it('sends a bounded JSON:API subscription request', async () => {
    fetchSpy.mockResolvedValueOnce(new Response(null, {status: 202}));

    const result = await subscribeToKlaviyoList(input);
    const [url, init] = fetchSpy.mock.calls[0];
    const payload = JSON.parse(String(init?.body));

    expect(result).toEqual({ok: true});
    expect(url).toBe('https://a.klaviyo.com/api/profile-subscription-bulk-create-jobs/');
    expect(init?.method).toBe('POST');
    expect(init?.signal).toBeInstanceOf(AbortSignal);
    expect(payload.data.relationships.list.data.id).toBe('test-list');
    // Provider contract (revision 2024-02-15): profiles live in data.attributes.profiles.data.
    expect(init?.headers).toMatchObject({revision: '2024-02-15'});
    expect(payload.included).toBeUndefined();
    expect(payload.data.attributes.custom_source).toBe('website');
    const profile = payload.data.attributes.profiles.data[0];
    expect(profile.type).toBe('profile');
    expect(profile.attributes.email).toBe('shopper@example.com');
    expect(profile.attributes.properties).toBeUndefined();
    expect(profile.attributes.subscriptions.email.marketing.consent).toBe('SUBSCRIBED');
  });

  it('returns the HTTP status without exposing the provider response body', async () => {
    fetchSpy.mockResolvedValueOnce(new Response('private provider details', {status: 429}));

    const result = await subscribeToKlaviyoList(input);

    expect(result).toEqual({ok: false, kind: 'http', status: 429});
  });

  it('returns network and timeout errors to the caller for structured reporting', async () => {
    const networkError = new Error('network failure');
    fetchSpy.mockRejectedValueOnce(networkError);

    const result = await subscribeToKlaviyoList(input);

    expect(result).toEqual({ok: false, kind: 'network', error: networkError});
  });
});

describe('requestKlaviyoBackInStock', () => {
  let fetchSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    fetchSpy = vi.spyOn(globalThis, 'fetch');
  });

  afterEach(() => {
    fetchSpy.mockRestore();
  });

  const input = {apiKey: 'test-key', email: 'shopper@example.com', shopifyVariantId: '456'};

  it('creates a per-variant restock request without any marketing subscription', async () => {
    fetchSpy.mockResolvedValueOnce(new Response(null, {status: 202}));

    const result = await requestKlaviyoBackInStock(input);
    const [url, init] = fetchSpy.mock.calls[0];
    const payload = JSON.parse(String(init?.body));

    expect(result).toEqual({ok: true});
    expect(url).toBe('https://a.klaviyo.com/api/back-in-stock-subscriptions/');
    expect(init?.headers).toMatchObject({revision: '2024-02-15', Authorization: 'Klaviyo-API-Key test-key'});
    expect(payload.data.type).toBe('back-in-stock-subscription');
    expect(payload.data.attributes.channels).toEqual(['EMAIL']);
    expect(payload.data.attributes.profile.data.attributes.email).toBe('shopper@example.com');
    expect(payload.data.relationships.variant.data).toEqual({
      type: 'catalog-variant',
      id: '$shopify:::$default:::456',
    });
    expect(JSON.stringify(payload)).not.toContain('subscriptions');
  });

  it('reports HTTP and network failures without the provider body', async () => {
    fetchSpy.mockResolvedValueOnce(new Response('private', {status: 400}));
    expect(await requestKlaviyoBackInStock(input)).toEqual({ok: false, kind: 'http', status: 400});
    const err = new Error('down');
    fetchSpy.mockRejectedValueOnce(err);
    expect(await requestKlaviyoBackInStock(input)).toEqual({ok: false, kind: 'network', error: err});
  });
});
