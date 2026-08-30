import {describe, expect, it} from 'vitest';
import {
  isAvailableCountry,
  normalizeCountryCode,
  type MarketCountry,
} from './market';

const markets = [
  {isoCode: 'US'},
  {isoCode: 'CA'},
] as Pick<MarketCountry, 'isoCode'>[];

describe('market country validation', () => {
  it('normalizes valid country codes', () => {
    expect(normalizeCountryCode(' ca ')).toBe('CA');
  });

  it('rejects malformed values', () => {
    expect(normalizeCountryCode('USD')).toBeNull();
    expect(normalizeCountryCode('../US')).toBeNull();
    expect(normalizeCountryCode(null)).toBeNull();
  });

  it('accepts only countries Shopify reports as available', () => {
    expect(isAvailableCountry('CA', markets)).toBe(true);
    expect(isAvailableCountry('FR', markets)).toBe(false);
  });
});
