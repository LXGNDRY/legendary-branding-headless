import {describe, expect, it} from 'vitest';
import {
  isAvailableCountry,
  isAvailableLanguage,
  normalizeCountryCode,
  normalizeLanguageCode,
  type MarketCountry,
  type MarketLanguage,
} from './market';

const markets = [
  {isoCode: 'US'},
  {isoCode: 'CA'},
] as Pick<MarketCountry, 'isoCode'>[];

const languages = [
  {isoCode: 'EN'},
  {isoCode: 'ES'},
  {isoCode: 'PT_BR'},
] as Pick<MarketLanguage, 'isoCode'>[];

describe('market country validation', () => {
  it('normalizes valid country codes', () => {
    expect(normalizeCountryCode(' ca ')).toBe('CA');
  });

  it('rejects malformed values', () => {
    expect(normalizeCountryCode('USD')).toBeNull();
    expect(normalizeCountryCode('../US')).toBeNull();
    expect(normalizeCountryCode(null)).toBeNull();
  });

  it('rejects unknown two-letter regions before they reach Shopify GraphQL', () => {
    expect(normalizeCountryCode('ZZ')).toBeNull();
  });

  it('accepts only countries Shopify reports as available', () => {
    expect(isAvailableCountry('CA', markets)).toBe(true);
    expect(isAvailableCountry('FR', markets)).toBe(false);
  });
});


describe('market language validation', () => {
  it('normalizes Shopify language codes', () => {
    expect(normalizeLanguageCode(' pt_br ')).toBe('PT_BR');
  });

  it('rejects malformed language codes', () => {
    expect(normalizeLanguageCode('english')).toBeNull();
    expect(normalizeLanguageCode('../EN')).toBeNull();
    expect(normalizeLanguageCode(null)).toBeNull();
  });

  it('accepts only languages Shopify reports as available', () => {
    expect(isAvailableLanguage('ES', languages)).toBe(true);
    expect(isAvailableLanguage('FR', languages)).toBe(false);
  });
});
