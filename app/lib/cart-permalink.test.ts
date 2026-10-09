import {describe, it, expect} from 'vitest';
import {parsePermalinkDiscount, parsePermalinkLines} from './cart-permalink';

describe('parsePermalinkLines', () => {
  it('parses a single variant:quantity pair', () => {
    expect(parsePermalinkLines('123:2')).toEqual([
      {merchandiseId: 'gid://shopify/ProductVariant/123', quantity: 2},
    ]);
  });

  it('parses multiple lines and defaults a bare id to quantity 1', () => {
    expect(parsePermalinkLines('1:3,2')).toEqual([
      {merchandiseId: 'gid://shopify/ProductVariant/1', quantity: 3},
      {merchandiseId: 'gid://shopify/ProductVariant/2', quantity: 1},
    ]);
  });

  it.each(['', 'abc:1', '1:0', '1:-1', '1:100', '1:x', '1:2:3', '1:2,', 'gid://shopify/ProductVariant/1:1'])(
    'rejects malformed input %j',
    (input) => {
      expect(parsePermalinkLines(input)).toBeNull();
    },
  );

  it('rejects undefined and oversized carts', () => {
    expect(parsePermalinkLines(undefined)).toBeNull();
    expect(parsePermalinkLines(Array.from({length: 21}, (_, i) => `${i + 1}:1`).join(','))).toBeNull();
  });
});

describe('parsePermalinkDiscount', () => {
  it('accepts a normal code and trims it', () => {
    expect(parsePermalinkDiscount(' SAVE10 ')).toBe('SAVE10');
  });

  it('rejects empty, missing, or unsafe codes', () => {
    expect(parsePermalinkDiscount(null)).toBeNull();
    expect(parsePermalinkDiscount('  ')).toBeNull();
    expect(parsePermalinkDiscount('<script>')).toBeNull();
  });
});
