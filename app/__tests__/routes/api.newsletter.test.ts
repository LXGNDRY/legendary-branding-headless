import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest';
import {action, loader} from '~/routes/api.newsletter';
import {createMockStorefront} from '~/test/mock-storefront';

describe('api.newsletter action', () => {
  let fetchSpy: ReturnType<typeof vi.spyOn>;
  let requestNumber = 0;

  beforeEach(() => {
    fetchSpy = vi.spyOn(globalThis, 'fetch');
  });

  afterEach(() => {
    fetchSpy.mockRestore();
  });

  function makeRequest(
    body: unknown,
    options: {contentType?: string; origin?: string} = {},
  ) {
    requestNumber += 1;
    return new Request('http://localhost/api/newsletter', {
      method: 'POST',
      headers: {
        Origin: options.origin ?? 'http://localhost',
        'Content-Type': options.contentType ?? 'application/json',
        'X-Forwarded-For': `198.51.100.${requestNumber}`,
      },
      body:
        options.contentType === 'application/x-www-form-urlencoded'
          ? new URLSearchParams(body as Record<string, string>)
          : JSON.stringify(body),
    });
  }

  async function submit(request: Request, env: Record<string, string> = {}) {
    const context = createMockStorefront().createContext({env});
    // @ts-expect-error - minimal Hydrogen app context for this action
    return action({request, context, params: {}});
  }

  it('rejects non-POST requests', async () => {
    const response = await submit(new Request('http://localhost/api/newsletter'));

    expect(response.status).toBe(405);
  });

  it('rejects requests from a different origin', async () => {
    const response = await submit(
      makeRequest({email: 'shopper@example.com'}, {origin: 'https://attacker.example'}),
      {PRIVATE_KLAVIYO_API_KEY: 'test-key', PUBLIC_KLAVIYO_LIST_ID: 'test-list'},
    );

    expect(response.status).toBe(403);
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('rejects invalid email without contacting Klaviyo', async () => {
    const response = await submit(
      makeRequest({email: 'not-an-email'}),
      {PRIVATE_KLAVIYO_API_KEY: 'test-key', PUBLIC_KLAVIYO_LIST_ID: 'test-list'},
    );

    expect(response.status).toBe(400);
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('returns unavailable when Klaviyo is not configured', async () => {
    const response = await submit(makeRequest({email: 'shopper@example.com'}));
    const data = await response.json();

    expect(response.status).toBe(503);
    expect(data.error).toMatch(/unavailable/i);
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('subscribes the sanitized email to the configured list', async () => {
    fetchSpy.mockResolvedValueOnce(new Response(null, {status: 202}));
    const response = await submit(
      makeRequest({email: ' Shopper@Example.com ', source: '  footer  '}),
      {PRIVATE_KLAVIYO_API_KEY: 'test-key', PUBLIC_KLAVIYO_LIST_ID: 'test-list'},
    );
    const data = await response.json();
    const [url, init] = fetchSpy.mock.calls[0];
    const payload = JSON.parse(String(init?.body));

    expect(response.status).toBe(200);
    expect(data).toMatchObject({success: true, subscribed: true});
    expect(url).toBe('https://a.klaviyo.com/api/profile-subscription-bulk-create-jobs/');
    expect(init?.headers).toMatchObject({Authorization: 'Klaviyo-API-Key test-key'});
    expect(payload.data.relationships.list.data.id).toBe('test-list');
    expect(payload.data.attributes.custom_source).toBe('footer');
    expect(payload.included[0].attributes.email).toBe('shopper@example.com');
  });

  it('returns a provider error when Klaviyo rejects the request', async () => {
    fetchSpy.mockResolvedValueOnce(new Response('upstream failure', {status: 500}));
    const response = await submit(
      makeRequest({email: 'shopper@example.com'}),
      {PRIVATE_KLAVIYO_API_KEY: 'test-key', PUBLIC_KLAVIYO_LIST_ID: 'test-list'},
    );

    expect(response.status).toBe(502);
    expect(await response.json()).toMatchObject({error: expect.stringMatching(/try again/i)});
  });
});

describe('api.newsletter loader', () => {
  it('rejects GET requests', async () => {
    const response = loader({} as never);

    expect(response.status).toBe(405);
  });
});
