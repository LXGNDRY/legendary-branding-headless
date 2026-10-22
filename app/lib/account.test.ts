import {afterEach, describe, expect, it, vi} from 'vitest';
import {
  ADDRESS_ZONES,
  accountMeta,
  isAddressId,
  loadAccount,
  mutationErrors,
  parseAddressForm,
  parseAfterCursor,
} from '~/lib/account';

vi.mock('~/lib/monitoring', () => ({captureError: vi.fn()}));

const form = (values: Record<string, string>) => {
  const data = new FormData();
  for (const [key, value] of Object.entries(values)) data.set(key, value);
  return data;
};

const base = {firstName: 'Ada', lastName: 'Lovelace', address1: '1 Main St', city: 'Chicago', zip: '60601', country: 'US', province: 'IL'};

describe('accountMeta', () => {
  it('always carries noindex so a child route cannot drop the parent robots entry', () => {
    expect(accountMeta('Orders', 'Your orders')).toEqual([
      {title: 'Orders | LEGENDARY BRANDING'},
      {name: 'description', content: 'Your orders'},
      {name: 'robots', content: 'noindex, nofollow'},
    ]);
    expect(accountMeta('Login').some((m) => 'name' in m && m.name === 'robots')).toBe(true);
  });
});

describe('loadAccount', () => {
  afterEach(() => vi.clearAllMocks());

  it('returns the data on success', async () => {
    expect(await loadAccount('t', async () => ({data: {a: 1}}))).toEqual({ok: true, data: {a: 1}});
  });

  it('turns missing data, GraphQL errors and thrown failures into a not-ok result', async () => {
    expect(await loadAccount('t', async () => ({data: null}))).toEqual({ok: false});
    expect(await loadAccount('t', async () => ({data: {a: 1}, errors: [{message: 'boom'}]}))).toEqual({ok: false});
    expect(
      await loadAccount('t', async () => {
        throw new Error('network');
      }),
    ).toEqual({ok: false});
  });

  it('lets a redirect Response through, so an expired session still goes to login', async () => {
    const redirect = new Response(null, {status: 302, headers: {Location: '/account/login'}});
    await expect(
      loadAccount('t', async () => {
        throw redirect;
      }),
    ).rejects.toBe(redirect);
  });
});

describe('parseAfterCursor', () => {
  const url = (query: string) => new URL(`https://shop.test/account/orders${query}`);

  it('accepts an opaque cursor', () => {
    expect(parseAfterCursor(url('?after=eyJsYXN0X2lkIjoxfQ%3D%3D'))).toBe('eyJsYXN0X2lkIjoxfQ==');
  });

  it('ignores anything that is not cursor-shaped', () => {
    expect(parseAfterCursor(url(''))).toBeNull();
    expect(parseAfterCursor(url('?after='))).toBeNull();
    expect(parseAfterCursor(url('?after=a b'))).toBeNull();
    expect(parseAfterCursor(url('?after=%7B%22x%22%7D'))).toBeNull();
    expect(parseAfterCursor(url(`?after=${'a'.repeat(600)}`))).toBeNull();
  });
});

describe('isAddressId', () => {
  it('only accepts customer address gids', () => {
    expect(isAddressId('gid://shopify/CustomerAddress/123?model_name=CustomerAddress')).toBe(true);
    expect(isAddressId('gid://shopify/CustomerAddress/123')).toBe(true);
    expect(isAddressId('gid://shopify/Customer/123')).toBe(false);
    expect(isAddressId('')).toBe(false);
    expect(isAddressId('gid://shopify/CustomerAddress/1; drop')).toBe(false);
  });
});

describe('parseAddressForm', () => {
  it('builds the API input for a US address with a required state', () => {
    const result = parseAddressForm(form(base));
    expect(result).toEqual({
      ok: true,
      input: {
        firstName: 'Ada', lastName: 'Lovelace', company: null, address1: '1 Main St', address2: null,
        city: 'Chicago', zoneCode: 'IL', zip: '60601', territoryCode: 'US', phoneNumber: null,
      },
    });
  });

  it('requires a state or province for countries with a fixed list, and rejects a code outside it', () => {
    expect(parseAddressForm(form({...base, province: ''}))).toMatchObject({ok: false, errors: ['Choose a state or province.']});
    expect(parseAddressForm(form({...base, province: 'ON'}))).toMatchObject({ok: false});
    expect(parseAddressForm(form({...base, country: 'CA', province: 'ON'}))).toMatchObject({ok: true});
    expect(parseAddressForm(form({...base, country: 'AU', province: 'nsw'}))).toMatchObject({ok: true, input: {zoneCode: 'NSW'}});
  });

  it('keeps every listed code unique per country', () => {
    for (const zones of Object.values(ADDRESS_ZONES)) {
      expect(new Set(zones.map((z) => z.code)).size).toBe(zones.length);
    }
  });

  it('does not force a region on other countries, and validates one when given', () => {
    expect(parseAddressForm(form({...base, country: 'DE', province: '', zip: '10115', city: 'Berlin'}))).toMatchObject({
      ok: true,
      input: {zoneCode: null, territoryCode: 'DE'},
    });
    expect(parseAddressForm(form({...base, country: 'DE', province: 'by'}))).toMatchObject({ok: true, input: {zoneCode: 'BY'}});
    expect(parseAddressForm(form({...base, country: 'DE', province: 'Bavaria, Germany'}))).toMatchObject({ok: false});
  });

  it('rejects a missing or malformed country instead of defaulting one', () => {
    expect(parseAddressForm(form({...base, country: ''}))).toMatchObject({ok: false, errors: ['Choose a country.']});
    expect(parseAddressForm(form({...base, country: 'Germany'}))).toMatchObject({ok: false});
    expect(parseAddressForm(form({...base, country: 'USA'}))).toMatchObject({ok: false});
  });

  it('preserves accented, CJK and right-to-left text and strips control characters', () => {
    const result = parseAddressForm(
      form({
        ...base, country: 'JP', province: '', firstName: 'José\u0000', lastName: '山田', address1: 'شارع 5', city: '東京都',
        zip: '100-0001', company: 'Müller & Söhne',
      }),
    );
    expect(result).toMatchObject({
      ok: true,
      input: {firstName: 'José', lastName: '山田', address1: 'شارع 5', city: '東京都', company: 'Müller & Söhne'},
    });
  });

  it('collects every missing field and bounds field length', () => {
    const empty = parseAddressForm(form({country: 'US', province: 'IL'}));
    expect(empty.ok).toBe(false);
    if (!empty.ok) expect(empty.errors).toEqual(expect.arrayContaining(['First name is required.', 'Last name is required.', 'Address is required.', 'City is required.', 'ZIP / postal code is required.']));
    expect(parseAddressForm(form({...base, address1: 'x'.repeat(300)}))).toMatchObject({ok: false, errors: ['One of the fields is too long.']});
  });
});

describe('mutationErrors', () => {
  it('is null on success', () => {
    expect(mutationErrors('t', {}, {userErrors: []})).toBeNull();
  });

  it('returns the user errors', () => {
    expect(mutationErrors('t', {}, {userErrors: [{message: 'Zip is invalid'}, {message: null}]})).toEqual(['Zip is invalid']);
  });

  it('gives a generic message when the payload is missing or the API reported errors', () => {
    expect(mutationErrors('t', {}, null)).toEqual(["We couldn't save that right now. Please try again."]);
    expect(mutationErrors('t', {errors: [{message: 'x'}]}, {userErrors: []})).toEqual(["We couldn't save that right now. Please try again."]);
  });
});
