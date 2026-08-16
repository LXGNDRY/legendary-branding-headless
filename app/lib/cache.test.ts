import {describe, it, expect} from 'vitest';
import {CacheLong, CacheShort, CacheNone} from './cache';

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
