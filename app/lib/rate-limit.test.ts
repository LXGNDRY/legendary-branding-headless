import {afterEach, beforeEach, describe, it, expect, vi} from 'vitest';
import {
  MAX_TRACKED_KEYS,
  RATE_POLICIES,
  checkRateLimit,
  enforceRatePolicy,
  getClientIP,
  rateLimitMiddleware,
  resetRateLimits,
  trackedKeyCount,
} from './rate-limit';

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

  it('never keys on the user agent: a request with no identity shares one bucket', () => {
    const a = requestWithHeaders({'user-agent': 'Mozilla/5.0 A'});
    const b = requestWithHeaders({'user-agent': 'Mozilla/5.0 B'});
    expect(getClientIP(a)).toBe('unidentified');
    expect(getClientIP(b)).toBe('unidentified');
    expect(getClientIP(new Request('https://example.com'))).toBe('unidentified');
  });

  it('ignores client-controllable forwarding headers once the edge header is present', () => {
    expect(getClientIP(requestWithHeaders({'cf-connecting-ip': '1.2.3.4', 'x-forwarded-for': '6.6.6.6'}))).toBe('1.2.3.4');
    // an unusable edge value is not a license to trust a forged header
    expect(getClientIP(requestWithHeaders({'cf-connecting-ip': '', 'x-forwarded-for': '6.6.6.6'}))).toBe('unidentified');
  });

  it('rejects oversized or malformed identities instead of minting a bucket for them', () => {
    expect(getClientIP(requestWithHeaders({'x-forwarded-for': 'a'.repeat(200)}))).toBe('unidentified');
    expect(getClientIP(requestWithHeaders({'x-forwarded-for': 'bad value'}))).toBe('unidentified');
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

describe('window expiry and bounded storage', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    resetRateLimits();
  });
  afterEach(() => vi.useRealTimers());

  it('keeps a long-window entry through other traffic and cleanup', () => {
    // 1 request per hour: the old fixed 60 s sweep would have deleted this entry after a minute.
    expect(checkRateLimit('hourly', 1, 3_600_000).limited).toBe(false);
    for (let minute = 1; minute <= 30; minute++) {
      vi.advanceTimersByTime(60_000);
      for (let i = 0; i < 250; i++) checkRateLimit(`other-${minute}-${i}`, 5, 60_000);
    }
    expect(checkRateLimit('hourly', 1, 3_600_000).limited).toBe(true);
    vi.advanceTimersByTime(31 * 60_000);
    expect(checkRateLimit('hourly', 1, 3_600_000).limited).toBe(false);
  });

  it('expires short-window entries so storage does not grow with old identities', () => {
    for (let i = 0; i < 400; i++) checkRateLimit(`old-${i}`, 5, 1_000);
    vi.advanceTimersByTime(2_000);
    for (let i = 0; i < 200; i++) checkRateLimit(`new-${i}`, 5, 1_000);
    expect(trackedKeyCount()).toBeLessThanOrEqual(200);
  });

  it('never tracks more than the hard bound, even for a flood of live identities', () => {
    for (let i = 0; i < MAX_TRACKED_KEYS + 1_500; i++) checkRateLimit(`flood-${i}`, 5, 3_600_000);
    expect(trackedKeyCount()).toBeLessThanOrEqual(MAX_TRACKED_KEYS + 200);
  });
});

describe('enforceRatePolicy', () => {
  beforeEach(() => resetRateLimits());
  const from = (ip: string) => new Request('https://example.com', {headers: {'cf-connecting-ip': ip}});

  it('applies the named policy per client', () => {
    for (let i = 0; i < RATE_POLICIES.newsletter.max; i++) expect(enforceRatePolicy(from('1.1.1.1'), 'newsletter')).toBeNull();
    const limited = enforceRatePolicy(from('1.1.1.1'), 'newsletter');
    expect(limited?.status).toBe(429);
    expect(limited?.headers.get('X-RateLimit-Limit')).toBe(String(RATE_POLICIES.newsletter.max));
    expect(limited?.headers.get('Cache-Control')).toBe('no-store');
    expect(enforceRatePolicy(from('2.2.2.2'), 'newsletter')).toBeNull();
  });

  it('requires every listed policy to pass', () => {
    const request = from('3.3.3.3');
    for (let i = 0; i < RATE_POLICIES.newsletter.max; i++) enforceRatePolicy(request, 'newsletter');
    expect(enforceRatePolicy(request, 'search', 'newsletter')?.status).toBe(429);
  });
});
