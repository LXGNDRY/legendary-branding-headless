import {describe, expect, it} from 'vitest';
import {checkStorefrontToken} from './validate-storefront-token.mjs';

function fakeFetch(status, body) {
  return async () => ({
    status,
    ok: status >= 200 && status < 300,
    text: async () => JSON.stringify(body),
  });
}

describe('checkStorefrontToken', () => {
  it('skips (does not fail) when domain or token is missing, e.g. Dependabot/fork PRs', async () => {
    const result = await checkStorefrontToken({domain: '', token: ''});
    expect(result.ok).toBe(true);
    expect(result.skipped).toBe(true);
    expect(result.message).toMatch(/Skipping/);
  });

  it('fails with a timeout-specific message when the request times out', async () => {
    const result = await checkStorefrontToken(
      {domain: 'example.myshopify.com', token: 'token', timeoutMs: 5},
      async () => {
        const error = new Error('The operation was aborted');
        error.name = 'TimeoutError';
        throw error;
      },
    );
    expect(result.ok).toBe(false);
    expect(result.message).toMatch(/did not respond within/);
  });

  it('fails with an actionable message on 401', async () => {
    const result = await checkStorefrontToken(
      {domain: 'example.myshopify.com', token: 'bad-token'},
      fakeFetch(401, {errors: {errors: [{extensions: {code: 'UNAUTHORIZED'}}]}}),
    );
    expect(result.ok).toBe(false);
    expect(result.message).toMatch(/HTTP 401/);
    expect(result.message).toMatch(/Admin API token/);
  });

  it('fails on GraphQL errors even with a 200 status', async () => {
    const result = await checkStorefrontToken(
      {domain: 'example.myshopify.com', token: 'token'},
      fakeFetch(200, {errors: [{message: 'some error'}]}),
    );
    expect(result.ok).toBe(false);
    expect(result.message).toMatch(/GraphQL errors/);
  });

  it('succeeds when the shop name comes back', async () => {
    const result = await checkStorefrontToken(
      {domain: 'example.myshopify.com', token: 'token'},
      fakeFetch(200, {data: {shop: {name: 'Example Shop'}}}),
    );
    expect(result.ok).toBe(true);
    expect(result.message).toMatch(/Example Shop/);
  });

  it('fails when a request throws (network error)', async () => {
    const result = await checkStorefrontToken(
      {domain: 'example.myshopify.com', token: 'token'},
      async () => {
        throw new Error('boom');
      },
    );
    expect(result.ok).toBe(false);
    expect(result.message).toMatch(/Could not reach/);
  });
});
