import {createContext, useContext, useMemo, type ReactNode} from 'react';
import type {LanguageCode} from '@shopify/hydrogen/storefront-api-types';
import english from '~/locales/en.json';
import german from '~/locales/de.json';
import spanish from '~/locales/es.json';
import french from '~/locales/fr.json';
import hindi from '~/locales/hi.json';
import indonesian from '~/locales/id.json';
import italian from '~/locales/it.json';
import portugueseBrazil from '~/locales/pt-BR.json';

export type TranslationKey = keyof typeof english;
type TranslationCatalog = Record<TranslationKey, string>;
type Interpolation = Record<string, string | number>;

const CATALOGS: Partial<Record<LanguageCode, TranslationCatalog>> = {
  DE: german,
  EN: english,
  ES: spanish,
  FR: french,
  HI: hindi,
  ID: indonesian,
  IT: italian,
  PT_BR: portugueseBrazil,
};

function format(template: string, values?: Interpolation) {
  if (!values) return template;
  return template.replace(/\{([\w.-]+)\}/g, (token, key) =>
    Object.prototype.hasOwnProperty.call(values, key) ? String(values[key]) : token,
  );
}

export function translate(language: LanguageCode | string | null | undefined, key: TranslationKey, values?: Interpolation) {
  const catalog = CATALOGS[language as LanguageCode] ?? english;
  return format(catalog[key] ?? english[key], values);
}

const TranslationContext = createContext<(key: TranslationKey, values?: Interpolation) => string>(
  (key, values) => translate('EN', key, values),
);

export function LocaleProvider({language, children}: {language: LanguageCode; children: ReactNode}) {
  const value = useMemo(() => (key: TranslationKey, values?: Interpolation) => translate(language, key, values), [language]);
  return <TranslationContext.Provider value={value}>{children}</TranslationContext.Provider>;
}

export function useTranslation() {
  return useContext(TranslationContext);
}
