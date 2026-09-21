import type {
  CountryCode,
  CurrencyCode,
  LanguageCode,
} from '@shopify/hydrogen/storefront-api-types';

export const DEFAULT_COUNTRY: CountryCode = 'US';
export const DEFAULT_LANGUAGE: LanguageCode = 'EN';

const COUNTRY_CODE = /^[A-Z]{2}$/;
const REGION_NAMES = new Intl.DisplayNames(['en'], {type: 'region'});

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
  if (!COUNTRY_CODE.test(normalized)) return null;
  const regionName = REGION_NAMES.of(normalized);
  if (!regionName || regionName === normalized || regionName === 'Unknown Region') {
    return null;
  }
  return normalized as CountryCode;
}

export function isAvailableCountry(
  country: CountryCode,
  availableCountries: Pick<MarketCountry, 'isoCode'>[],
) {
  return availableCountries.some((candidate) => candidate.isoCode === country);
}

// ISO 3166-1 alpha-2 codes only -- names are derived via Intl.DisplayNames
// (below) rather than hardcoded, so they always match the runtime's locale
// data. Used for the account address form's country <select>: submitting
// the code directly (instead of a free-text country name) removes the need
// to guess a territoryCode from user-typed text, which was silently wrong
// for most non-US countries (e.g. "Germany" -> "GE" Georgia).
const COUNTRY_CODES = [
  'US', 'CA', 'MX', 'GB', 'IE', 'FR', 'DE', 'ES', 'IT', 'PT', 'NL', 'BE',
  'LU', 'CH', 'AT', 'DK', 'SE', 'NO', 'FI', 'IS', 'PL', 'CZ', 'SK', 'HU',
  'RO', 'BG', 'GR', 'HR', 'SI', 'EE', 'LV', 'LT', 'MT', 'CY', 'AU', 'NZ',
  'JP', 'KR', 'CN', 'HK', 'TW', 'SG', 'MY', 'TH', 'VN', 'PH', 'ID', 'IN',
  'PK', 'BD', 'AE', 'SA', 'IL', 'TR', 'ZA', 'NG', 'EG', 'KE', 'BR', 'AR',
  'CL', 'CO', 'PE', 'UY', 'EC', 'CR', 'PA', 'DO', 'JM', 'TT',
] as const;

export function getCountryOptions(): {code: CountryCode; name: string}[] {
  return COUNTRY_CODES
    .map((code) => ({code, name: REGION_NAMES.of(code) ?? code}))
    .sort((a, b) => a.name.localeCompare(b.name));
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
