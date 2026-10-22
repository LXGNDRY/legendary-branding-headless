import {describe, expect, it} from 'vitest';
import {
  MAX_ENCODED_COOKIE_LENGTH,
  MAX_RECENT_PRODUCTS,
  parseRecentProducts,
  readRecentProducts,
  serializeRecentProducts,
} from './recently-viewed';

const product = (n: number, extra: Record<string, unknown> = {}) => ({id: `gid://shopify/Product/${n}`, handle: `tee-${n}`, title: `Tee ${n}`, ...extra});

describe('parseRecentProducts', () => {
  it.each([null, undefined, 'x', 5, {a: 1}, [null], [5], ['x']])('never throws for non-list input %j', (input) => {
    expect(parseRecentProducts(input as unknown)).toEqual([]);
  });

  it('keeps valid entries, drops malformed ones, and de-duplicates by id', () => {
    const out = parseRecentProducts([
      product(1),
      {...product(2), handle: '<script>'},
      {...product(3), title: ''},
      product(1, {title: 'dup'}),
      product(4, {image: 'javascript:alert(1)', rating: 99, reviewCount: -3}),
    ]);
    expect(out.map((p) => p.id)).toEqual(['gid://shopify/Product/1', 'gid://shopify/Product/4']);
    expect(out[1]).toEqual({id: 'gid://shopify/Product/4', handle: 'tee-4', title: 'Tee 4'});
  });

  it('accepts https images and sane ratings', () => {
    const [p] = parseRecentProducts([product(1, {image: 'https://cdn.shopify.com/a.jpg', rating: 4.5, reviewCount: 12})]);
    expect(p).toMatchObject({image: 'https://cdn.shopify.com/a.jpg', rating: 4.5, reviewCount: 12});
  });

  it('caps the list', () => {
    expect(parseRecentProducts(Array.from({length: 40}, (_, i) => product(i + 1)))).toHaveLength(MAX_RECENT_PRODUCTS);
  });
});

describe('readRecentProducts', () => {
  const cookie = (value: string) => `a=1; recently_viewed=${value}; b=2`;

  it('reads a well-formed cookie', () => {
    expect(readRecentProducts(cookie(encodeURIComponent(JSON.stringify([product(1)]))))).toHaveLength(1);
  });

  it.each([
    ['bad percent escape', cookie('%E0%A4%A')],
    ['object not array', cookie(encodeURIComponent('{"a":1}'))],
    ['invalid JSON', cookie(encodeURIComponent('{nope'))],
    ['missing cookie', 'a=1'],
  ])('returns [] for %s', (_name, header) => {
    expect(readRecentProducts(header)).toEqual([]);
  });
});

describe('serializeRecentProducts', () => {
  it('drops the oldest entries until the encoded cookie fits', () => {
    const fat = Array.from({length: 8}, (_, i) =>
      product(i + 1, {title: 'é'.repeat(120), image: `https://cdn.shopify.com/${'a'.repeat(380)}.jpg`}),
    );
    const out = serializeRecentProducts(fat);
    expect(encodeURIComponent(out).length).toBeLessThanOrEqual(MAX_ENCODED_COOKIE_LENGTH);
    const kept = JSON.parse(out);
    expect(kept.length).toBeGreaterThan(0);
    expect(kept.length).toBeLessThan(8);
    expect(kept[0].id).toBe('gid://shopify/Product/1');
  });
});
