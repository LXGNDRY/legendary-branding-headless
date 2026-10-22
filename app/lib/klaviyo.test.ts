import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest';
import {subscribeToKlaviyoList} from '~/lib/klaviyo';

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
    expect(payload.included[0].attributes.subscriptions.email.marketing.consent).toBe('SUBSCRIBED');
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
