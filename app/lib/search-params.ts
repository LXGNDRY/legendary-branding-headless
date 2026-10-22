import type {SearchSortKeys} from '@shopify/hydrogen/storefront-api-types';

export const MAX_QUERY_LENGTH = 120;
const MAX_FILTER_LENGTH = 100;
const MAX_PRICE = 1_000_000;

/** A finite, non-negative, bounded price from a URL parameter; anything else is ignored. */
export function parsePrice(value: string | null | undefined): number | undefined {
  if (!value || !/^\d{1,7}(\.\d{1,4})?$/.test(value)) return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 0 && parsed <= MAX_PRICE ? parsed : undefined;
}

/** Valid price bounds; an inverted range is swapped so min is never above max. */
export function parsePriceRange(min: string | null | undefined, max: string | null | undefined) {
  const lower = parsePrice(min);
  const upper = parsePrice(max);
  if (lower !== undefined && upper !== undefined && lower > upper) return {minPrice: upper, maxPrice: lower};
  return {minPrice: lower, maxPrice: upper};
}

/** Only the sort keys the Storefront `search` field accepts (PRICE, RELEVANCE). */
export function parseSearchSort(sort: string | null | undefined): SearchSortKeys {
  return sort === 'PRICE' ? 'PRICE' : 'RELEVANCE';
}

export function cleanSearchText(value: string | null | undefined, max = MAX_FILTER_LENGTH): string | undefined {
  const cleaned = value?.replace(/\p{Cc}/gu, '').trim().slice(0, max);
  return cleaned ? cleaned : undefined;
}

export function cleanSearchQuery(value: string | null | undefined): string {
  return cleanSearchText(value, MAX_QUERY_LENGTH) ?? '';
}
