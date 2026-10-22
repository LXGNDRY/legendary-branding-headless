import {describe, expect, it} from 'vitest';
import {
  MAX_WISHLIST_ITEMS,
  mergeWishlists,
  parseStoredWishlist,
  parseWishlistEntries,
  sameWishlist,
  serializeWishlist,
} from './wishlist';

const NOW = 1_700_000_000_000;
const entry = (n: number, addedAt = NOW - n) => ({id: `gid://shopify/Product/${n}`, handle: `tee-${n}`, addedAt});

describe('parseWishlistEntries', () => {
  it('keeps identity only and migrates legacy snapshot fields away', () => {
    const [item] = parseWishlistEntries(
      [{...entry(1), title: 'Tee', price: '10.00', image: 'javascript:alert(1)', rating: 5}],
      NOW,
    );
    expect(item).toEqual(entry(1));
  });

  it.each([
    ['null', null],
    ['object', {items: []}],
    ['string', 'x'],
    ['number', 5],
  ])('returns [] for non-array input: %s', (_name, input) => {
    expect(parseWishlistEntries(input)).toEqual([]);
  });

  it('skips malformed entries without dropping valid ones', () => {
    const out = parseWishlistEntries(
      [
        null,
        5,
        'x',
        {id: 'gid://shopify/Product/1'},
        {id: 'not-a-gid', handle: 'a'},
        {id: 'gid://shopify/Product/2', handle: '<script>'},
        {id: 'gid://shopify/Product/3', handle: 'a'.repeat(300)},
        {id: 'gid://shopify/ProductVariant/4', handle: 'variant'},
        entry(9),
      ],
      NOW,
    );
    expect(out).toEqual([entry(9)]);
  });

  it('collapses duplicates (case-insensitive) to the earliest addedAt and caps the list', () => {
    const dup = parseWishlistEntries([{...entry(1), addedAt: 200}, {...entry(1), handle: 'TEE-1', addedAt: 100}], NOW);
    expect(dup).toHaveLength(1);
    expect(dup[0].addedAt).toBe(100);
    const many = Array.from({length: 250}, (_, i) => entry(i + 1, NOW - 1000 + i));
    expect(parseWishlistEntries(many, NOW)).toHaveLength(MAX_WISHLIST_ITEMS);
  });

  it('repairs missing, non-finite and future timestamps', () => {
    const out = parseWishlistEntries(
      [{...entry(1), addedAt: undefined}, {...entry(2), addedAt: Infinity}, {...entry(3), addedAt: NOW + 9e9}],
      NOW,
    );
    expect(out.every((item) => item.addedAt === NOW)).toBe(true);
  });
});

describe('parseStoredWishlist', () => {
  it('round-trips a saved list', () => {
    const items = [entry(1, NOW - 2), entry(2, NOW - 1)];
    expect(parseStoredWishlist(serializeWishlist(items, NOW), NOW)).toEqual(items);
  });

  it('accepts the legacy unversioned shape and strips snapshots', () => {
    const legacy = JSON.stringify({items: [{...entry(1), title: 'Tee', price: '1'}], savedAt: NOW});
    expect(parseStoredWishlist(legacy, NOW)).toEqual([entry(1)]);
  });

  it.each([
    ['missing', null],
    ['empty', ''],
    ['invalid JSON', '{nope'],
    ['array', '[1,2]'],
    ['null', 'null'],
    ['string', '"x"'],
    ['items not array', JSON.stringify({items: {a: 1}, savedAt: NOW})],
    ['oversized', 'x'.repeat(40_000)],
  ])('never throws and returns [] for %s', (_name, raw) => {
    expect(parseStoredWishlist(raw as string | null, NOW)).toEqual([]);
  });

  it('expires data older than 30 days', () => {
    const old = JSON.stringify({items: [entry(1)], savedAt: NOW - 31 * 864e5});
    expect(parseStoredWishlist(old, NOW)).toEqual([]);
  });
});

describe('mergeWishlists / sameWishlist', () => {
  it('unions by handle keeping the older addedAt', () => {
    const merged = mergeWishlists([{...entry(1), addedAt: 300}], [{...entry(1), addedAt: 100}, entry(2, 200)]);
    expect(merged.map((i) => [i.handle, i.addedAt])).toEqual([
      ['tee-1', 100],
      ['tee-2', 200],
    ]);
  });

  it('compares lists by handle regardless of order', () => {
    expect(sameWishlist([entry(1), entry(2)], [entry(2), entry(1)])).toBe(true);
    expect(sameWishlist([entry(1)], [entry(2)])).toBe(false);
    expect(sameWishlist([entry(1)], [entry(1), entry(2)])).toBe(false);
  });
});
