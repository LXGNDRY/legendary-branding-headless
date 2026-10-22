import {describe, expect, it, vi} from 'vitest';
import {action, loader} from '~/routes/api.wishlist';
import {loader as productsLoader} from '~/routes/api.wishlist-products';
import {createMockStorefront} from '~/test/mock-storefront';

let ip = 0;
function post(body: string, init: RequestInit = {}) {
  ip += 1;
  return new Request('http://localhost/api/wishlist', {
    method: 'POST',
    body,
    ...init,
    headers: {Origin: 'http://localhost', 'X-Forwarded-For': `192.0.2.${ip}`, ...(init.headers as Record<string, string>)},
  });
}

function account({loggedIn = true, stored = null as string | null, userErrors = [] as {message: string}[], fail = false} = {}) {
  const mutate = vi.fn(async () => ({data: {metafieldsSet: {userErrors}}}));
  return {
    mutate,
    context: {
      customerAccount: {
        isLoggedIn: async () => loggedIn,
        query: async () => {
          if (fail) throw new Error('provider stack trace');
          return {data: {customer: {id: 'gid://shopify/Customer/1', wishlistMetafield: stored ? {value: stored} : null}}};
        },
        mutate,
      },
    },
  };
}

const entry = {id: 'gid://shopify/Product/1', handle: 'tee-1', addedAt: 1000};
const privateNoStore = (res: Response) => expect(res.headers.get('Cache-Control')).toBe('no-store');

describe('api.wishlist loader', () => {
  it('rejects guests with a private response', async () => {
    // @ts-expect-error - minimal Hydrogen app context
    const res = await loader({request: new Request('http://localhost/api/wishlist'), context: account({loggedIn: false}).context, params: {}});
    expect(res.status).toBe(401);
    privateNoStore(res);
  });

  it('returns validated identity entries and drops malformed or legacy fields', async () => {
    const stored = JSON.stringify([{...entry, title: 'Tee', price: '1', image: 'javascript:alert(1)'}, {id: 'x'}, null]);
    // @ts-expect-error - minimal Hydrogen app context
    const res = await loader({request: new Request('http://localhost/api/wishlist'), context: account({stored}).context, params: {}});
    expect(res.status).toBe(200);
    expect((await res.json()).items).toEqual([entry]);
    privateNoStore(res);
  });

  it('treats corrupt metafield JSON as an empty list', async () => {
    // @ts-expect-error - minimal Hydrogen app context
    const res = await loader({request: new Request('http://localhost/api/wishlist'), context: account({stored: '{nope'}).context, params: {}});
    expect((await res.json()).items).toEqual([]);
  });

  it('returns a generic, uncached error without provider details', async () => {
    // @ts-expect-error - minimal Hydrogen app context
    const res = await loader({request: new Request('http://localhost/api/wishlist'), context: account({fail: true}).context, params: {}});
    expect(res.status).toBe(500);
    privateNoStore(res);
    expect(JSON.stringify(await res.json())).not.toContain('stack trace');
  });
});

describe('api.wishlist action', () => {
  const run = (request: Request, ctx = account()) =>
    // @ts-expect-error - minimal Hydrogen app context
    action({request, context: ctx.context, params: {}});

  it('rejects non-POST methods with 405', async () => {
    const res = await run(post('{}', {method: 'PUT'}));
    expect(res.status).toBe(405);
    expect(res.headers.get('Allow')).toBe('GET, POST');
    privateNoStore(res);
  });

  it('requires a signed-in customer', async () => {
    const res = await run(post(JSON.stringify({items: []})), account({loggedIn: false}));
    expect(res.status).toBe(401);
    privateNoStore(res);
  });

  it.each([
    ['invalid JSON', '{nope'],
    ['missing items', '{}'],
    ['items not an array', '{"items":"x"}'],
    ['null body', 'null'],
  ])('returns 400 for %s', async (_name, body) => {
    const res = await run(post(body));
    expect(res.status).toBe(400);
    privateNoStore(res);
  });

  it('returns 413 for oversized bodies, declared or actual', async () => {
    const big = JSON.stringify({items: [], pad: 'x'.repeat(40_000)});
    expect((await run(post(big))).status).toBe(413);
    const declared = await run(post('{"items":[]}', {headers: {'Content-Length': '999999'}}));
    expect(declared.status).toBe(413);
  });

  it('rejects absurd item counts', async () => {
    const items = Array.from({length: 250}, (_, i) => ({id: `gid://shopify/Product/${i + 1}`, handle: `t${i}`, addedAt: 1}));
    expect((await run(post(JSON.stringify({items})))).status).toBe(400);
  });

  it('stores only validated identity entries', async () => {
    const ctx = account();
    const res = await run(
      post(JSON.stringify({items: [{...entry, title: '<script>', price: '9', image: 'javascript:x'}, {id: 'bad', handle: '<b>'}]})),
      ctx,
    );
    expect(res.status).toBe(200);
    expect((await res.json()).items).toEqual([entry]);
    const call = ctx.mutate.mock.calls[0] as unknown as [string, {variables: {metafields: {value: string}[]}}];
    expect(JSON.parse(call[1].variables.metafields[0].value)).toEqual([entry]);
    privateNoStore(res);
  });

  it('does not return provider validation messages', async () => {
    const res = await run(post(JSON.stringify({items: [entry]})), account({userErrors: [{message: 'secret metafield definition detail'}]}));
    expect(res.status).toBe(400);
    expect(JSON.stringify(await res.json())).not.toContain('secret');
  });

  it('returns a generic error when the provider throws', async () => {
    const res = await run(post(JSON.stringify({items: [entry]})), account({fail: true}));
    expect(res.status).toBe(500);
    expect(JSON.stringify(await res.json())).not.toContain('stack trace');
  });
});

describe('api.wishlist-products loader', () => {
  const card = (n: number) => ({__typename: 'Product', id: `gid://shopify/Product/${n}`, title: `Tee ${n}`, handle: `tee-${n}`});
  const run = (ids: string, nodes: unknown[], country = 'US') => {
    ip += 1;
    const mock = createMockStorefront({responses: {WishlistProducts: {nodes}}});
    mock.storefront.i18n = {country, language: 'EN'} as typeof mock.storefront.i18n;
    // @ts-expect-error - minimal Hydrogen app context
    return productsLoader({request: new Request(`http://localhost/api/wishlist-products?ids=${ids}`, {headers: {'X-Forwarded-For': `198.18.0.${ip}`}}), context: mock.createContext(), params: {}}).then((res: Response) => ({res, calls: mock.getCalls()}));
  };

  it('returns live cards by id, null for deleted/unavailable products, in the active market, uncached', async () => {
    const {res, calls} = await run('gid://shopify/Product/1,gid://shopify/Product/2', [card(1), null], 'ES');
    const body = await res.json();
    expect(body.products['gid://shopify/Product/1'].title).toBe('Tee 1');
    expect(body.products['gid://shopify/Product/2']).toBeNull();
    expect(calls[0].variables).toMatchObject({country: 'ES'});
    expect(res.headers.get('Cache-Control')).toBe('private, no-store');
  });

  it('rejects invalid or excessive ids without calling Shopify', async () => {
    for (const ids of ['bad', 'gid://shopify/Product/1,gid://shopify/Collection/2', Array.from({length: 101}, (_, i) => `gid://shopify/Product/${i + 1}`).join(',')]) {
      const {res, calls} = await run(ids, []);
      expect(res.status).toBe(400);
      expect(calls).toHaveLength(0);
    }
  });

  it('returns an empty map for no ids and an uncached 502 for upstream failure', async () => {
    const {res} = await run('', []);
    expect((await res.json()).products).toEqual({});
    ip += 1;
    const broken = createMockStorefront({responses: {}});
    // @ts-expect-error - minimal Hydrogen app context
    const failed = await productsLoader({request: new Request('http://localhost/api/wishlist-products?ids=gid://shopify/Product/1', {headers: {'X-Forwarded-For': `198.18.1.${ip}`}}), context: broken.createContext(), params: {}});
    expect(failed.status).toBe(502);
    expect(failed.headers.get('Cache-Control')).toBe('no-store');
  });
});
