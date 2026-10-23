/**
 * URL locale contract (SEO-07 in docs/HYDROGEN_TECHNICAL_SEO_PLAN.md).
 *
 * Shopify has 8 languages enabled: EN (default), DE, ES, FR, HI, ID, IT, PT_BR.
 * Each gets its own URL subfolder so Google indexes them as distinct resources
 * (session-only language selection is treated as duplicate content). English
 * stays at the root; every other language sits under its lowercase-hyphen slug:
 *
 *   /          -> EN (default)
 *   /de/*      -> DE
 *   /es/*      -> ES
 *   /fr/*      -> FR
 *   /hi/*      -> HI
 *   /id/*      -> ID
 *   /it/*      -> IT
 *   /pt-br/*   -> PT_BR
 *
 * The server strips the prefix before React Router sees the URL (see server.ts
 * and app/lib/context.ts) and sets storefront.i18n.language from the URL, so
 * every @inContext query returns the right translation. Canonical, hreflang
 * and sitemap emit the prefixed public URL.
 */
import type {LanguageCode} from '@shopify/hydrogen/storefront-api-types';

export type SupportedLanguage = 'EN' | 'DE' | 'ES' | 'FR' | 'HI' | 'ID' | 'IT' | 'PT_BR';

export const DEFAULT_URL_LANGUAGE: SupportedLanguage = 'EN';

/** URL subfolder slug per language. `''` means "no prefix" (default language at root). */
const LANGUAGE_TO_SLUG: Record<SupportedLanguage, string> = {
  EN: '',
  DE: 'de',
  ES: 'es',
  FR: 'fr',
  HI: 'hi',
  ID: 'id',
  IT: 'it',
  PT_BR: 'pt-br',
};

/** HTML `lang` attribute per language (BCP 47). */
const LANGUAGE_TO_HTML: Record<SupportedLanguage, string> = {
  EN: 'en',
  DE: 'de',
  ES: 'es',
  FR: 'fr',
  HI: 'hi',
  ID: 'id',
  IT: 'it',
  PT_BR: 'pt-BR',
};

const SLUG_TO_LANGUAGE: Record<string, SupportedLanguage> = Object.fromEntries(
  (Object.entries(LANGUAGE_TO_SLUG) as [SupportedLanguage, string][])
    .filter(([, slug]) => slug.length > 0)
    .map(([language, slug]) => [slug, language]),
);

export const SUPPORTED_URL_LANGUAGES = Object.keys(LANGUAGE_TO_SLUG) as SupportedLanguage[];

/** Lowercase-hyphen slugs for non-default languages (used by route matchers and tests). */
export const SUPPORTED_URL_SLUGS = Object.values(LANGUAGE_TO_SLUG).filter((slug) => slug.length > 0);

export function languageUrlSlug(language: SupportedLanguage): string {
  return LANGUAGE_TO_SLUG[language];
}

export function languageHtmlTag(language: SupportedLanguage): string {
  return LANGUAGE_TO_HTML[language];
}

/**
 * Shopify LanguageCode -> SupportedLanguage when it is one of the enabled set.
 * Case-tolerant so `pt_br`, `PT_BR` and `PT-BR` all resolve the same way.
 */
export function toSupportedLanguage(value: LanguageCode | string | null | undefined): SupportedLanguage | null {
  if (typeof value !== 'string') return null;
  const normalized = value.trim().toUpperCase().replace('-', '_');
  return SUPPORTED_URL_LANGUAGES.includes(normalized as SupportedLanguage)
    ? (normalized as SupportedLanguage)
    : null;
}

/**
 * Parse a URL pathname into {language, path}. If the first segment is a known
 * locale slug it is removed; otherwise the pathname is returned unchanged and
 * language falls back to the default. Never throws; always returns a safe
 * absolute-looking path (leading slash, no fragment or query).
 */
export function parseLocalizedPath(pathname: string): {language: SupportedLanguage; path: string} {
  if (typeof pathname !== 'string' || pathname.length === 0) {
    return {language: DEFAULT_URL_LANGUAGE, path: '/'};
  }
  const clean = pathname.split(/[?#]/)[0] || '/';
  const normalized = clean.startsWith('/') ? clean : `/${clean}`;
  const match = /^\/([a-z]{2}(?:-[a-z]{2,3})?)(\/.*)?$/.exec(normalized.toLowerCase());
  if (!match) return {language: DEFAULT_URL_LANGUAGE, path: normalized};
  const slug = match[1];
  const language = SLUG_TO_LANGUAGE[slug];
  if (!language) return {language: DEFAULT_URL_LANGUAGE, path: normalized};
  // NOTE: when the trailing path is empty (e.g. "/de" or "/de/"), route to the locale's root.
  const remainder = (match[2] ?? '/').length > 0 ? (match[2] ?? '/') : '/';
  return {language, path: remainder};
}

/**
 * Prefix a site-relative path (`/products/foo`) with the locale slug. The
 * default language returns the path unchanged; `/` for a non-default locale
 * returns `/<slug>` (not `/<slug>/`), matching canonical/hreflang conventions.
 */
export function localizePath(path: string, language: SupportedLanguage): string {
  if (typeof path !== 'string') return '/';
  const trimmed = path.split(/[?#]/)[0] || '/';
  const normalized = trimmed.startsWith('/') ? trimmed : `/${trimmed}`;
  const slug = LANGUAGE_TO_SLUG[language];
  if (!slug) return normalized;
  if (normalized === '/') return `/${slug}`;
  return `/${slug}${normalized}`;
}

/**
 * True if `path` starts with a known locale slug (e.g. `/de/products/foo`),
 * false otherwise. Useful for guarding links that should not be prefixed again.
 */
export function hasLocalePrefix(path: string): boolean {
  const {language} = parseLocalizedPath(path);
  return language !== DEFAULT_URL_LANGUAGE || /^\/([a-z]{2}(?:-[a-z]{2,3})?)(?:$|\/)/.test(path.toLowerCase() ?? '');
}

/**
 * The ordered list of {language, path} pairs for hreflang / sitemap alternates
 * covering one logical page. x-default callers can treat the EN entry as the
 * default (first by convention).
 */
type LanguageInput = LanguageCode | string | null | undefined;

/** Shopify language code (EN, PT_BR) to a BCP 47 tag (en, pt-BR). Anything unusable falls back to English. */
export function languageTag(language: LanguageInput): string {
  if (typeof language !== 'string') return 'en';
  const match = /^([A-Za-z]{2})(?:[_-]([A-Za-z]{2}))?$/.exec(language.trim());
  if (!match) return 'en';
  const base = match[1].toLowerCase();
  return match[2] ? `${base}-${match[2].toUpperCase()}` : base;
}

/** Locale segment Shopify checkout accepts (`?locale=pt-BR`). */
export function checkoutLocale(language: LanguageInput): string {
  return languageTag(language);
}

export function formatDate(iso: string, language: LanguageInput): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  return new Intl.DateTimeFormat(languageTag(language), {year: 'numeric', month: 'long', day: 'numeric'}).format(date);
}

export function formatMoney(amount: string | number, currency: string, language: LanguageInput): string {
  const value = typeof amount === 'number' ? amount : parseFloat(amount);
  if (!Number.isFinite(value)) return '';
  return new Intl.NumberFormat(languageTag(language), {style: 'currency', currency}).format(value);
}

export function formatNumber(value: number, language: LanguageInput): string {
  return new Intl.NumberFormat(languageTag(language)).format(value);
}

export function localeAlternates(path: string): Array<{language: SupportedLanguage; htmlLang: string; path: string}> {
  // Strip any existing prefix so we start from the canonical site-relative path.
  const {path: bare} = parseLocalizedPath(path);
  return SUPPORTED_URL_LANGUAGES.map((language) => ({
    language,
    htmlLang: LANGUAGE_TO_HTML[language],
    path: localizePath(bare, language),
  }));
}
