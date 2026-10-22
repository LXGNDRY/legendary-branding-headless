import {describe, expect, it} from 'vitest';
import {cleanSearchQuery, cleanSearchText, parsePrice, parsePriceRange, parseSearchSort} from './search-params';

describe('parsePrice', () => {
  it.each([
    ['10', 10],
    ['0', 0],
    ['19.99', 19.99],
    ['1000000', 1_000_000],
  ])('accepts %s', (input, expected) => expect(parsePrice(input)).toBe(expected));

  it.each(['NaN', 'Infinity', '-Infinity', '-5', 'abc', '', '1e999', '1000001', '123456789012345', '0x10', null, undefined])(
    'ignores %s',
    (input) => expect(parsePrice(input as string | null | undefined)).toBeUndefined(),
  );
});

describe('parsePriceRange', () => {
  it('swaps an inverted range and keeps valid single bounds', () => {
    expect(parsePriceRange('50', '10')).toEqual({minPrice: 10, maxPrice: 50});
    expect(parsePriceRange('10', null)).toEqual({minPrice: 10, maxPrice: undefined});
    expect(parsePriceRange('NaN', '30')).toEqual({minPrice: undefined, maxPrice: 30});
  });
});

describe('parseSearchSort', () => {
  it('only allows the sort keys the Storefront search field accepts', () => {
    expect(parseSearchSort('PRICE')).toBe('PRICE');
    expect(parseSearchSort('RELEVANCE')).toBe('RELEVANCE');
    for (const bad of ['TITLE', 'CREATED_AT', 'BEST_SELLING', 'price', '"; drop', '', null, undefined]) {
      expect(parseSearchSort(bad as string | null | undefined)).toBe('RELEVANCE');
    }
  });
});

describe('text cleaning', () => {
  it('strips control characters, trims and bounds length', () => {
    expect(cleanSearchQuery('  tee\u0000\n shirt  ')).toBe('tee shirt');
    expect(cleanSearchQuery('x'.repeat(500))).toHaveLength(120);
    expect(cleanSearchQuery(null)).toBe('');
    expect(cleanSearchText('   ')).toBeUndefined();
    expect(cleanSearchText('a'.repeat(300))).toHaveLength(100);
  });
});
