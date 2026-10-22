import type {LanguageCode} from '@shopify/hydrogen/storefront-api-types';

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
