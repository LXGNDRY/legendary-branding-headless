/**
 * Chat widget API route tests.
 */

import {describe, it, expect, beforeEach, vi, afterEach} from 'vitest';
import {action, loader} from '~/routes/api.chat';
import {createMockStorefront} from '~/test/mock-storefront';

describe('api.chat action', () => {
  let mockStorefront: ReturnType<typeof createMockStorefront>;
  let fetchSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    mockStorefront = createMockStorefront({
      responses: {
        ChatProductSearch: {products: {nodes: []}},
      },
    });
    fetchSpy = vi.spyOn(globalThis, 'fetch');
  });

  afterEach(() => {
    fetchSpy.mockRestore();
  });

  it('rejects non-POST requests', async () => {
    const context = mockStorefront.createContext();
    const request = new Request('http://localhost/api/chat', {method: 'GET'});

    // @ts-expect-error - minimal mock context
    const response = await action({request, context, params: {}});

    expect(response.status).toBe(405);
  });

  it('returns 400 for an empty message', async () => {
    const context = mockStorefront.createContext({env: {PRIVATE_ANTHROPIC_API_KEY: 'key'}});
    const request = new Request('http://localhost/api/chat', {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({message: '   '}),
    });

    // @ts-expect-error - minimal mock context
    const response = await action({request, context, params: {}});

    expect(response.status).toBe(400);
  });

  it('returns 503 without simulating a reply when the API key is unset', async () => {
    const context = mockStorefront.createContext({env: {}});
    const request = new Request('http://localhost/api/chat', {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({message: 'Do you have any hoodies?'}),
    });

    // @ts-expect-error - minimal mock context
    const response = await action({request, context, params: {}});
    const data = (await response.json()) as {error: string};

    expect(response.status).toBe(503);
    expect(data.error).toMatch(/unavailable/i);
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('returns the assistant reply on success', async () => {
    fetchSpy.mockResolvedValueOnce(
      new Response(
        JSON.stringify({content: [{type: 'text', text: 'We have a few hoodies in stock.'}]}),
        {status: 200},
      ),
    );

    const context = mockStorefront.createContext({env: {PRIVATE_ANTHROPIC_API_KEY: 'key'}});
    const request = new Request('http://localhost/api/chat', {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({message: 'Do you have any hoodies?'}),
    });

    // @ts-expect-error - minimal mock context
    const response = await action({request, context, params: {}});
    const data = (await response.json()) as {reply: string};

    expect(response.status).toBe(200);
    expect(data.reply).toBe('We have a few hoodies in stock.');
  });

  it('returns 502 when the upstream API errors', async () => {
    fetchSpy.mockResolvedValueOnce(new Response('server error', {status: 500}));

    const context = mockStorefront.createContext({env: {PRIVATE_ANTHROPIC_API_KEY: 'key'}});
    const request = new Request('http://localhost/api/chat', {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({message: 'Do you have any hoodies?'}),
    });

    // @ts-expect-error - minimal mock context
    const response = await action({request, context, params: {}});

    expect(response.status).toBe(502);
  });
});

describe('api.chat loader', () => {
  it('rejects GET requests', async () => {
    const request = new Request('http://localhost/api/chat');
    // @ts-expect-error - minimal mock args
    const response = loader({request, params: {}});

    expect(response.status).toBe(405);
  });
});
