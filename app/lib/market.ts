import type {
  CountryCode,
  CurrencyCode,
  LanguageCode,
} from '@shopify/hydrogen/storefront-api-types';

export const DEFAULT_COUNTRY: CountryCode = 'US';
export const DEFAULT_LANGUAGE: LanguageCode = 'EN';

const COUNTRY_CODE = /^[A-Z]{2}$/;

export interface MarketCountry {
  isoCode: CountryCode;
  name: string;
  currency: {
    isoCode: CurrencyCode;
    symbol: string;
  };
}

export interface LocalizationData {
  country: MarketCountry;
  availableCountries: MarketCountry[];
}

export function normalizeCountryCode(value: unknown): CountryCode | null {
  if (typeof value !== 'string') return null;
  const normalized = value.trim().toUpperCase();
  return COUNTRY_CODE.test(normalized) ? (normalized as CountryCode) : null;
}

export function isAvailableCountry(
  country: CountryCode,
  availableCountries: Pick<MarketCountry, 'isoCode'>[],
) {
  return availableCountries.some((candidate) => candidate.isoCode === country);
}

export const LOCALIZATION_QUERY = `#graphql
  query StorefrontLocalization($country: CountryCode, $language: LanguageCode)
    @inContext(country: $country, language: $language) {
    localization {
      country {
        isoCode
        name
        currency {
          isoCode
          symbol
        }
      }
      availableCountries {
        isoCode
        name
        currency {
          isoCode
          symbol
        }
      }
    }
  }
` as const;
