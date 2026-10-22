import {describe, it, expect} from 'vitest';
import {CacheLong, CacheShort, CacheNone, withDefaultCacheControl} from './cache';

describe('Cache utilities', () => {
  describe('CacheLong', () => {
    it('returns a full cache strategy object', () => {
      const result = CacheLong();
      expect(result).toHaveProperty('mode');
      expect(result).toHaveProperty('maxAge');
      expect(result).toHaveProperty('staleWhileRevalidate');
    });

    it('has maxAge of 3600 seconds (1 hour)', () => {
      const result = CacheLong();
      expect(result.maxAge).toBe(3600);
    });

    it('includes staleWhileRevalidate of 24 hours', () => {
      const result = CacheLong();
      expect(result.staleWhileRevalidate).toBe(86400);
    });

    it('includes staleIfError of 7 days', () => {
      const result = CacheLong();
      expect(result.staleIfError).toBe(604800);
    });
  });

  describe('CacheShort', () => {
    it('has shorter maxAge (60 seconds)', () => {
      const result = CacheShort();
      expect(result.maxAge).toBe(60);
    });
  });

  describe('CacheNone', () => {
    it('disables caching (no-store mode)', () => {
      const result = CacheNone();
      expect(result.mode).toBe('no-store');
    });
  });
});

describe('withDefaultCacheControl', () => {
  it('keeps documents out of shared caches by default', () => {
    expect(withDefaultCacheControl(new Response('ok')).headers.get('Cache-Control')).toBe(
      'private, max-age=0, must-revalidate',
    );
  });

  it('never caches error responses', () => {
    for (const status of [400, 404, 500, 503]) {
      expect(withDefaultCacheControl(new Response('x', {status})).headers.get('Cache-Control')).toBe('no-store');
    }
  });

  it('leaves an explicit Cache-Control untouched', () => {
    const res = new Response('ok', {headers: {'Cache-Control': 'public, max-age=3600'}});
    expect(withDefaultCacheControl(res).headers.get('Cache-Control')).toBe('public, max-age=3600');
    const err = new Response('x', {status: 500, headers: {'Cache-Control': 'no-store, no-cache'}});
    expect(withDefaultCacheControl(err).headers.get('Cache-Control')).toBe('no-store, no-cache');
  });
});
