import {describe, it, expect, vi, beforeEach, afterEach} from 'vitest';
import {checkRateLimit, getClientIP, rateLimitMiddleware} from './rate-limit';

describe('checkRateLimit', () => {
  it('allows requests under the limit and decrements remaining', () => {
    const key = `test-${Math.random()}`;
    const first = checkRateLimit(key, 3, 60_000);
    expect(first).toEqual({limited: false, remaining: 2, retryAfter: 0});

    const second = checkRateLimit(key, 3, 60_000);
    expect(second).toEqual({limited: false, remaining: 1, retryAfter: 0});
  });

  it('limits once maxRequests is reached within the window', () => {
    const key = `test-${Math.random()}`;
    checkRateLimit(key, 2, 60_000);
    checkRateLimit(key, 2, 60_000);
    const third = checkRateLimit(key, 2, 60_000);
    expect(third.limited).toBe(true);
    expect(third.remaining).toBe(0);
    expect(third.retryAfter).toBeGreaterThan(0);
  });

  it('resets after the window elapses', () => {
    vi.useFakeTimers();
    try {
      const key = `test-${Math.random()}`;
      checkRateLimit(key, 1, 1000);
      expect(checkRateLimit(key, 1, 1000).limited).toBe(true);

      vi.advanceTimersByTime(1001);

      expect(checkRateLimit(key, 1, 1000).limited).toBe(false);
    } finally {
      vi.useRealTimers();
    }
  });

  it('tracks distinct keys independently', () => {
    const keyA = `test-a-${Math.random()}`;
    const keyB = `test-b-${Math.random()}`;
    checkRateLimit(keyA, 1, 60_000);
    expect(checkRateLimit(keyA, 1, 60_000).limited).toBe(true);
    expect(checkRateLimit(keyB, 1, 60_000).limited).toBe(false);
  });
});

describe('getClientIP', () => {
  function requestWithHeaders(headers: Record<string, string>) {
    return new Request('https://example.com', {headers});
  }

  it('prefers cf-connecting-ip when present', () => {
    const request = requestWithHeaders({
      'cf-connecting-ip': '1.2.3.4',
      'x-forwarded-for': '5.6.7.8',
      'x-real-ip': '9.9.9.9',
    });
    expect(getClientIP(request)).toBe('1.2.3.4');
  });

  it('falls back to the first x-forwarded-for entry', () => {
    const request = requestWithHeaders({'x-forwarded-for': '5.6.7.8, 10.0.0.1'});
    expect(getClientIP(request)).toBe('5.6.7.8');
  });

  it('falls back to x-real-ip', () => {
    const request = requestWithHeaders({'x-real-ip': '9.9.9.9'});
    expect(getClientIP(request)).toBe('9.9.9.9');
  });

  it('falls back to a truncated user-agent hash when no IP header is present', () => {
    const request = requestWithHeaders({'user-agent': 'Mozilla/5.0 Test Browser'});
    expect(getClientIP(request)).toBe('ua:Mozilla/5.0 Test Browser');
  });

  it('falls back to "unknown" when nothing is available', () => {
    const request = new Request('https://example.com');
    expect(getClientIP(request)).toBe('ua:unknown');
  });
});

describe('rateLimitMiddleware', () => {
  it('returns null when under the limit', () => {
    const request = new Request('https://example.com', {headers: {'cf-connecting-ip': `${Math.random()}`}});
    expect(rateLimitMiddleware(request, 'test-route', 5)).toBeNull();
  });

  it('returns a 429 Response with Retry-After once limited', async () => {
    const ip = `${Math.random()}`;
    const request = new Request('https://example.com', {headers: {'cf-connecting-ip': ip}});
    rateLimitMiddleware(request, 'test-route-2', 1);
    const result = rateLimitMiddleware(request, 'test-route-2', 1);

    expect(result).not.toBeNull();
    expect(result!.status).toBe(429);
    expect(result!.headers.get('Retry-After')).toBeTruthy();
    const body = await result!.json();
    expect(body).toEqual({error: 'Too many requests'});
  });
});
