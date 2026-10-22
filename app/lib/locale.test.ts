import {describe, expect, it} from 'vitest';
import {checkoutLocale, formatDate, formatMoney, formatNumber, languageTag} from './locale';

describe('languageTag', () => {
  it.each([
    ['EN', 'en'],
    ['FR', 'fr'],
    ['DE', 'de'],
    ['PT_BR', 'pt-BR'],
    ['pt-br', 'pt-BR'],
    [null, 'en'],
    [undefined, 'en'],
    ['', 'en'],
    ['not a language', 'en'],
    ['EN_US_X', 'en'],
  ])('%s -> %s', (input, expected) => {
    expect(languageTag(input as string | null | undefined)).toBe(expected);
  });

  it('matches the checkout locale', () => {
    expect(checkoutLocale('PT_BR')).toBe('pt-BR');
    expect(checkoutLocale('DE')).toBe('de');
  });
});

describe('formatters', () => {
  it('formats dates in the selected language', () => {
    expect(formatDate('2026-03-05T12:00:00Z', 'EN')).toBe('March 5, 2026');
    expect(formatDate('2026-03-05T12:00:00Z', 'FR')).toBe('5 mars 2026');
    expect(formatDate('2026-03-05T12:00:00Z', 'DE')).toBe('5. März 2026');
  });

  it('formats money with the language separators and the real currency', () => {
    expect(formatMoney('1234.5', 'USD', 'EN')).toBe('$1,234.50');
    expect(formatMoney('1234.5', 'EUR', 'DE')).toContain('1.234,50');
    expect(formatMoney('1234.5', 'EUR', 'DE')).toContain('€');
  });

  it('formats numbers by language', () => {
    expect(formatNumber(1234567, 'EN')).toBe('1,234,567');
    expect(formatNumber(1234567, 'DE')).toBe('1.234.567');
  });

  it('returns an empty string instead of throwing for invalid input', () => {
    expect(formatDate('not a date', 'EN')).toBe('');
    expect(formatMoney('abc', 'USD', 'EN')).toBe('');
  });
});
