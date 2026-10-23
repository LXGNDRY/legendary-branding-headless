import {describe, expect, it} from 'vitest';
import {
  DEFAULT_URL_LANGUAGE,
  SUPPORTED_URL_LANGUAGES,
  SUPPORTED_URL_SLUGS,
  checkoutLocale,
  formatDate,
  formatMoney,
  formatNumber,
  hasLocalePrefix,
  languageHtmlTag,
  languageTag,
  languageUrlSlug,
  localeAlternates,
  localizePath,
  parseLocalizedPath,
  toSupportedLanguage,
} from './locale';

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

describe('locale URL contract', () => {
  it('declares all 8 Shopify-enabled languages', () => {
    expect(SUPPORTED_URL_LANGUAGES).toEqual(['EN', 'DE', 'ES', 'FR', 'HI', 'ID', 'IT', 'PT_BR']);
    expect(DEFAULT_URL_LANGUAGE).toBe('EN');
  });

  it('maps every non-default language to a URL slug', () => {
    expect(SUPPORTED_URL_SLUGS).toEqual(['de', 'es', 'fr', 'hi', 'id', 'it', 'pt-br']);
  });

  it('EN carries no slug (default at root)', () => {
    expect(languageUrlSlug('EN')).toBe('');
  });

  it('maps PT_BR to the hyphenated URL slug pt-br but the BCP47 lang tag pt-BR', () => {
    expect(languageUrlSlug('PT_BR')).toBe('pt-br');
    expect(languageHtmlTag('PT_BR')).toBe('pt-BR');
  });

  it('tolerates Shopify LanguageCode in multiple casings', () => {
    expect(toSupportedLanguage('PT_BR')).toBe('PT_BR');
    expect(toSupportedLanguage('pt_br')).toBe('PT_BR');
    expect(toSupportedLanguage('pt-br')).toBe('PT_BR');
    expect(toSupportedLanguage('en')).toBe('EN');
    expect(toSupportedLanguage('XX')).toBeNull();
    expect(toSupportedLanguage(null)).toBeNull();
    expect(toSupportedLanguage(undefined)).toBeNull();
  });
});

describe('parseLocalizedPath', () => {
  it('returns default + root for empty or garbage input', () => {
    expect(parseLocalizedPath('')).toEqual({language: 'EN', path: '/'});
    expect(parseLocalizedPath(null as unknown as string)).toEqual({language: 'EN', path: '/'});
  });

  it('strips a known locale slug and returns the rest', () => {
    expect(parseLocalizedPath('/de/products/foo')).toEqual({language: 'DE', path: '/products/foo'});
    expect(parseLocalizedPath('/pt-br/journal/x')).toEqual({language: 'PT_BR', path: '/journal/x'});
  });

  it('treats /de and /de/ as the locale root', () => {
    expect(parseLocalizedPath('/de')).toEqual({language: 'DE', path: '/'});
    expect(parseLocalizedPath('/de/')).toEqual({language: 'DE', path: '/'});
  });

  it('leaves an unknown first segment as part of the path', () => {
    expect(parseLocalizedPath('/collections/all-products')).toEqual({language: 'EN', path: '/collections/all-products'});
    expect(parseLocalizedPath('/xx/foo')).toEqual({language: 'EN', path: '/xx/foo'});
  });

  it('drops query and fragment before matching', () => {
    expect(parseLocalizedPath('/de/products/foo?bar=1#x')).toEqual({language: 'DE', path: '/products/foo'});
  });
});

describe('localizePath', () => {
  it('returns the path unchanged for the default language', () => {
    expect(localizePath('/products/foo', 'EN')).toBe('/products/foo');
    expect(localizePath('/', 'EN')).toBe('/');
  });

  it('prefixes non-default languages', () => {
    expect(localizePath('/products/foo', 'DE')).toBe('/de/products/foo');
    expect(localizePath('/products/foo', 'PT_BR')).toBe('/pt-br/products/foo');
  });

  it('returns /<slug> (no trailing slash) for the locale root', () => {
    expect(localizePath('/', 'DE')).toBe('/de');
    expect(localizePath('/', 'PT_BR')).toBe('/pt-br');
  });

  it('strips query and fragment', () => {
    expect(localizePath('/products/foo?bar=1#x', 'FR')).toBe('/fr/products/foo');
  });

  it('normalizes a path missing its leading slash', () => {
    expect(localizePath('products/foo', 'DE')).toBe('/de/products/foo');
  });
});

describe('hasLocalePrefix', () => {
  it('detects every supported non-default slug', () => {
    for (const slug of SUPPORTED_URL_SLUGS) {
      expect(hasLocalePrefix(`/${slug}/anything`)).toBe(true);
      expect(hasLocalePrefix(`/${slug}`)).toBe(true);
    }
  });

  it('returns false for the default (unprefixed) root and ordinary paths', () => {
    expect(hasLocalePrefix('/')).toBe(false);
    expect(hasLocalePrefix('/collections/all-products')).toBe(false);
  });
});

describe('localeAlternates', () => {
  it('emits one entry per supported language, starting with EN', () => {
    const alternates = localeAlternates('/products/foo');
    expect(alternates).toHaveLength(SUPPORTED_URL_LANGUAGES.length);
    expect(alternates[0]).toEqual({language: 'EN', htmlLang: 'en', path: '/products/foo'});
    expect(alternates.find((a) => a.language === 'DE')).toEqual({language: 'DE', htmlLang: 'de', path: '/de/products/foo'});
    expect(alternates.find((a) => a.language === 'PT_BR')).toEqual({language: 'PT_BR', htmlLang: 'pt-BR', path: '/pt-br/products/foo'});
  });

  it('strips an existing prefix so the alternates are self-consistent', () => {
    const alternates = localeAlternates('/de/products/foo');
    expect(alternates.find((a) => a.language === 'EN')?.path).toBe('/products/foo');
    expect(alternates.find((a) => a.language === 'FR')?.path).toBe('/fr/products/foo');
  });

  it('handles the root path', () => {
    const alternates = localeAlternates('/');
    expect(alternates.find((a) => a.language === 'EN')?.path).toBe('/');
    expect(alternates.find((a) => a.language === 'DE')?.path).toBe('/de');
  });
});
