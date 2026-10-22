import {describe, expect, it} from 'vitest';
import {
  isAvailableCountry,
  isAvailableLanguage,
  normalizeCountryCode,
  normalizeLanguageCode,
  staleMarketSelections,
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

describe('staleMarketSelections', () => {
  const localization = {
    availableCountries: [{isoCode: 'US'}, {isoCode: 'ES'}] as never,
    availableLanguages: [{isoCode: 'EN'}, {isoCode: 'ES'}] as never,
  };

  it('keeps supported selections and ignores an unset session', () => {
    expect(staleMarketSelections({country: 'ES', language: 'ES'}, localization)).toEqual([]);
    expect(staleMarketSelections({}, localization)).toEqual([]);
    expect(staleMarketSelections({country: null, language: undefined}, localization)).toEqual([]);
  });

  it('flags a removed market, a removed language and malformed values', () => {
    expect(staleMarketSelections({country: 'GB', language: 'FR'}, localization)).toEqual(['country', 'language']);
    expect(staleMarketSelections({country: 'ZZ', language: 'not-a-code'}, localization)).toEqual(['country', 'language']);
    expect(staleMarketSelections({country: 5, language: {}}, localization)).toEqual(['country', 'language']);
  });
});
