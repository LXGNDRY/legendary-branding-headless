/**
 * Customer account route tests against a mocked Customer Account API client. These prove the code paths
 * (guards, validation, pagination, error states); they do not replace a run against a synthetic account.
 */
import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest';
import {loader as indexLoader, meta as indexMeta} from '~/routes/account._index';
import {loader as ordersLoader, meta as ordersMeta} from '~/routes/account.orders';
import {loader as addressesLoader, action as addressesAction, meta as addressesMeta} from '~/routes/account.addresses';
import {loader as editLoader, action as editAction, meta as editMeta} from '~/routes/account.edit';
import {loader as logoutLoader, action as logoutAction} from '~/routes/account.logout';
import {loader as authorizeLoader} from '~/routes/account.authorize';
import {loader as loginLoader} from '~/routes/account.login';
import {meta as registerMeta} from '~/routes/account.register';
import {meta as authorizeMeta} from '~/routes/account.authorize';
import {meta as layoutMeta} from '~/routes/account';

vi.mock('~/lib/monitoring', () => ({captureError: vi.fn()}));

type Fn = (...args: unknown[]) => unknown;

function makeAccount(overrides: Record<string, Fn> = {}) {
  return {
    isLoggedIn: vi.fn(async () => true),
    query: vi.fn(async () => ({data: {}})),
    mutate: vi.fn(async () => ({data: {}})),
    login: vi.fn(async () => new Response(null, {status: 302, headers: {Location: 'https://shopify.test/login'}})),
    logout: vi.fn(async () => new Response(null, {status: 302, headers: {Location: '/'}})),
    authorize: vi.fn(async () => new Response(null, {status: 302, headers: {Location: '/account'}})),
    ...overrides,
  };
}

type Account = ReturnType<typeof makeAccount>;
const ctx = (customerAccount: Account | undefined) => ({customerAccount}) as never;
const get = (path: string) => new Request(`https://shop.test${path}`);
const post = (path: string, fields: Record<string, string>, headers: Record<string, string> = {}) => {
  const body = new FormData();
  for (const [key, value] of Object.entries(fields)) body.set(key, value);
  return new Request(`https://shop.test${path}`, {method: 'POST', body, headers});
};
const run = (fn: unknown, args: Record<string, unknown>) => (fn as (a: unknown) => Promise<any>)({params: {}, ...args});

const order = (n: number) => ({
  id: `gid://shopify/Order/${n}`, name: `#${n}`, number: n, processedAt: '2026-01-01T00:00:00Z', statusPageUrl: 'https://shop.test/s',
  totalPrice: {amount: '49.00', currencyCode: 'USD'}, lineItems: {nodes: []}, fulfillments: {nodes: []},
});
const address = (n: number) => ({
  id: `gid://shopify/CustomerAddress/${n}`, firstName: 'Ada', lastName: 'L', address1: '1 Main', city: 'Chicago', zip: '60601',
  territoryCode: 'US', zoneCode: 'IL', country: 'United States', province: 'Illinois',
});

describe('guards', () => {
  const loaders: Array<[string, unknown, string]> = [
    ['index', indexLoader, '/account'],
    ['orders', ordersLoader, '/account/orders'],
    ['addresses', addressesLoader, '/account/addresses'],
    ['edit', editLoader, '/account/edit'],
  ];

  it.each(loaders)('%s: 503 when customer accounts are not configured', async (_name, loader, path) => {
    await expect(run(loader, {request: get(path), context: ctx(undefined)})).rejects.toMatchObject({status: 503});
  });

  it.each(loaders)('%s: sends a signed-out visitor to login without querying', async (_name, loader, path) => {
    const account = makeAccount({isLoggedIn: vi.fn(async () => false)});
    const response = await run(loader, {request: get(path), context: ctx(account)});
    expect(response.status).toBe(302);
    expect(response.headers.get('Location')).toBe('/account/login');
    expect(account.query).not.toHaveBeenCalled();
  });

  it.each(loaders)('%s: lets an expired-session redirect from the API through', async (_name, loader, path) => {
    const redirect = new Response(null, {status: 302, headers: {Location: '/account/login'}});
    const account = makeAccount({
      query: vi.fn(async () => {
        throw redirect;
      }),
    });
    await expect(run(loader, {request: get(path), context: ctx(account)})).rejects.toBe(redirect);
  });
});

describe('API failures become error states, not 500s', () => {
  const failing = [
    ['thrown', () => makeAccount({query: vi.fn(async () => { throw new Error('upstream'); })})],
    ['GraphQL errors', () => makeAccount({query: vi.fn(async () => ({data: {customer: null}, errors: [{message: 'x'}]}))})],
    ['null customer', () => makeAccount({query: vi.fn(async () => ({data: {customer: null}}))})],
  ] as const;

  it.each(failing)('index (%s)', async (_label, make) => {
    expect((await run(indexLoader, {request: get('/account'), context: ctx(make())})).customer).toBeNull();
  });

  it.each(failing)('edit (%s)', async (_label, make) => {
    expect((await run(editLoader, {request: get('/account/edit'), context: ctx(make())})).customer).toBeNull();
  });

  it.each(failing)('orders (%s)', async (_label, make) => {
    expect(await run(ordersLoader, {request: get('/account/orders'), context: ctx(make())})).toMatchObject({failed: true, orders: []});
  });

  it.each(failing)('addresses (%s)', async (_label, make) => {
    expect(await run(addressesLoader, {request: get('/account/addresses'), context: ctx(make())})).toMatchObject({failed: true, addresses: []});
  });
});

describe('profile', () => {
  it('loads the customer', async () => {
    const account = makeAccount({query: vi.fn(async () => ({data: {customer: {firstName: 'José', lastName: '山田', emailAddress: {emailAddress: 'j@x.test'}}}}))});
    const data = await run(indexLoader, {request: get('/account'), context: ctx(account)});
    expect(data.customer).toMatchObject({firstName: 'José', lastName: '山田'});
  });

  it('updates names, keeping Unicode', async () => {
    const account = makeAccount({mutate: vi.fn(async () => ({data: {customerUpdate: {customer: {}, userErrors: []}}}))});
    const result = await run(editAction, {request: post('/account/edit', {firstName: 'José', lastName: '山田'}), context: ctx(account)});
    expect(result).toEqual({success: true, errors: []});
    expect(account.mutate.mock.calls[0][1]).toEqual({variables: {input: {firstName: 'José', lastName: '山田'}}});
  });

  it('validates before calling the API', async () => {
    const account = makeAccount();
    expect(await run(editAction, {request: post('/account/edit', {firstName: '', lastName: ''}), context: ctx(account)})).toMatchObject({success: false});
    expect(await run(editAction, {request: post('/account/edit', {firstName: 'x'.repeat(200), lastName: 'y'}), context: ctx(account)})).toMatchObject({success: false});
    expect(account.mutate).not.toHaveBeenCalled();
  });

  it('shows user errors, and a generic message when the API fails or answers with nothing usable', async () => {
    const withErrors = makeAccount({mutate: vi.fn(async () => ({data: {customerUpdate: {userErrors: [{message: 'Name is invalid'}]}}}))});
    expect(await run(editAction, {request: post('/account/edit', {firstName: 'a', lastName: 'b'}), context: ctx(withErrors)})).toEqual({success: false, errors: ['Name is invalid']});

    for (const mutate of [vi.fn(async () => { throw new Error('down'); }), vi.fn(async () => ({data: null})), vi.fn(async () => ({data: {customerUpdate: null}}))]) {
      const result = await run(editAction, {request: post('/account/edit', {firstName: 'a', lastName: 'b'}), context: ctx(makeAccount({mutate}))});
      expect(result.success).toBe(false);
      expect(result.errors[0]).toMatch(/couldn't save/i);
    }
  });

  it('rejects a cross-origin submission', async () => {
    const account = makeAccount();
    const response = await run(editAction, {request: post('/account/edit', {firstName: 'a', lastName: 'b'}, {Origin: 'https://evil.test'}), context: ctx(account)});
    expect(response.status).toBe(403);
    expect(account.mutate).not.toHaveBeenCalled();
  });
});

describe('orders pagination', () => {
  const page = (nodes: unknown[], endCursor: string | null) => ({data: {customer: {orders: {nodes, pageInfo: {hasNextPage: endCursor !== null, endCursor}}}}});

  it('passes the cursor on and reports the next one', async () => {
    const account = makeAccount({query: vi.fn(async () => page([order(1)], 'cursorB'))});
    const data = await run(ordersLoader, {request: get('/account/orders?after=cursorA'), context: ctx(account)});
    expect(account.query.mock.calls[0][1]).toEqual({variables: {first: 10, after: 'cursorA'}});
    expect(data).toMatchObject({failed: false, nextCursor: 'cursorB', isFirstPage: false});
  });

  it('reaches every order across pages, with no cursor on the last', async () => {
    const pages: Record<string, ReturnType<typeof page>> = {
      first: page(Array.from({length: 10}, (_, i) => order(i + 1)), 'c1'),
      c1: page(Array.from({length: 5}, (_, i) => order(i + 11)), null),
    };
    const account = makeAccount({query: vi.fn(async (_q: unknown, opts: {variables: {after: string | null}}) => pages[opts.variables.after ?? 'first'])});
    const first = await run(ordersLoader, {request: get('/account/orders'), context: ctx(account)});
    const second = await run(ordersLoader, {request: get(`/account/orders?after=${first.nextCursor}`), context: ctx(account)});
    expect(first.orders).toHaveLength(10);
    expect(first.isFirstPage).toBe(true);
    expect(second.orders).toHaveLength(5);
    expect(second.nextCursor).toBeNull();
    expect([...first.orders, ...second.orders].map((o: {number: number}) => o.number)).toEqual(Array.from({length: 15}, (_, i) => i + 1));
  });

  it('ignores a malformed cursor and tolerates null nodes', async () => {
    const account = makeAccount({query: vi.fn(async () => ({data: {customer: {orders: {nodes: null, pageInfo: null}}}}))});
    const data = await run(ordersLoader, {request: get('/account/orders?after=%7B%7D'), context: ctx(account)});
    expect((account.query.mock.calls[0][1] as {variables: {after: unknown}}).variables.after).toBeNull();
    expect(data).toMatchObject({failed: false, orders: [], nextCursor: null});
  });
});

describe('addresses', () => {
  const list = (nodes: unknown[], endCursor: string | null, def: unknown = null) => ({
    data: {customer: {defaultAddress: def, addresses: {nodes, pageInfo: {hasNextPage: endCursor !== null, endCursor}}}},
  });
  const base = {intent: 'create', firstName: 'Ada', lastName: 'Lovelace', address1: '1 Main', city: 'Chicago', zip: '60601', country: 'US', province: 'IL'};

  it('lists more than ten addresses across pages and keeps the default on the first page', async () => {
    const pages: Record<string, unknown> = {
      first: list(Array.from({length: 10}, (_, i) => address(i + 1)), 'c1', address(99)),
      c1: list(Array.from({length: 4}, (_, i) => address(i + 11)), null, address(99)),
    };
    const account = makeAccount({query: vi.fn(async (_q: unknown, opts: {variables: {after: string | null}}) => pages[opts.variables.after ?? 'first'])});
    const first = await run(addressesLoader, {request: get('/account/addresses'), context: ctx(account)});
    const second = await run(addressesLoader, {request: get(`/account/addresses?after=${first.nextCursor}`), context: ctx(account)});
    expect(first.addresses).toHaveLength(10);
    expect(first.defaultAddress.id).toContain('/99');
    expect(second.addresses).toHaveLength(4);
    expect(second.nextCursor).toBeNull();
  });

  it('shows the default address exactly once: first on page one, never again on a later page', async () => {
    const pages: Record<string, unknown> = {
      first: list([address(1), address(2)], 'c1', address(3)),
      c1: list([address(3), address(4)], null, address(3)),
    };
    const account = makeAccount({query: vi.fn(async (_q: unknown, opts: {variables: {after: string | null}}) => pages[opts.variables.after ?? 'first'])});
    const first = await run(addressesLoader, {request: get('/account/addresses'), context: ctx(account)});
    const second = await run(addressesLoader, {request: get('/account/addresses?after=c1'), context: ctx(account)});
    expect(first.defaultAddress.id).toContain('/3');
    expect(first.addresses.map((a: {id: string}) => a.id.split('/').pop())).toEqual(['1', '2']);
    expect(second.defaultAddress).toBeNull();
    expect(second.addresses.map((a: {id: string}) => a.id.split('/').pop())).toEqual(['4']);
  });

  it('creates with validated, authoritative codes', async () => {
    const account = makeAccount({mutate: vi.fn(async () => ({data: {customerAddressCreate: {customerAddress: {}, userErrors: []}}}))});
    const result = await run(addressesAction, {request: post('/account/addresses', base), context: ctx(account)});
    expect(result).toEqual({success: true, action: 'create'});
    expect((account.mutate.mock.calls[0][1] as {variables: {address: unknown}}).variables.address).toMatchObject({territoryCode: 'US', zoneCode: 'IL'});
  });

  it('never calls the API for an invalid country or a missing US state', async () => {
    const account = makeAccount();
    expect(await run(addressesAction, {request: post('/account/addresses', {...base, country: 'Germany'}), context: ctx(account)})).toMatchObject({success: false});
    expect(await run(addressesAction, {request: post('/account/addresses', {...base, province: ''}), context: ctx(account)})).toMatchObject({success: false});
    expect(account.mutate).not.toHaveBeenCalled();
  });

  it('accepts an international address with Unicode and no region', async () => {
    const account = makeAccount({mutate: vi.fn(async () => ({data: {customerAddressCreate: {customerAddress: {}, userErrors: []}}}))});
    const result = await run(addressesAction, {
      request: post('/account/addresses', {...base, country: 'JP', province: '', firstName: '花子', lastName: '山田', city: '東京都', zip: '100-0001'}),
      context: ctx(account),
    });
    expect(result.success).toBe(true);
    expect((account.mutate.mock.calls[0][1] as {variables: {address: unknown}}).variables.address).toMatchObject({firstName: '花子', city: '東京都', territoryCode: 'JP', zoneCode: null});
  });

  it('updates and deletes only well-formed address ids', async () => {
    const account = makeAccount({
      mutate: vi.fn(async () => ({data: {customerAddressUpdate: {userErrors: []}, customerAddressDelete: {userErrors: []}}})),
    });
    expect(await run(addressesAction, {request: post('/account/addresses', {...base, intent: 'update', id: 'not-an-id'}), context: ctx(account)})).toMatchObject({success: false});
    expect(await run(addressesAction, {request: post('/account/addresses', {intent: 'delete', id: 'x'}), context: ctx(account)})).toMatchObject({success: false});
    expect(account.mutate).not.toHaveBeenCalled();
    const id = 'gid://shopify/CustomerAddress/5?model_name=CustomerAddress';
    expect(await run(addressesAction, {request: post('/account/addresses', {...base, intent: 'update', id}), context: ctx(account)})).toEqual({success: true, action: 'update'});
    expect(await run(addressesAction, {request: post('/account/addresses', {intent: 'delete', id}), context: ctx(account)})).toEqual({success: true, action: 'delete'});
  });

  it('surfaces API user errors and survives a thrown or empty mutation', async () => {
    const withErrors = makeAccount({mutate: vi.fn(async () => ({data: {customerAddressCreate: {userErrors: [{message: 'Zip is invalid'}]}}}))});
    expect(await run(addressesAction, {request: post('/account/addresses', base), context: ctx(withErrors)})).toEqual({success: false, errors: ['Zip is invalid'], action: 'create'});
    for (const mutate of [vi.fn(async () => { throw new Error('down'); }), vi.fn(async () => ({data: null}))]) {
      const result = await run(addressesAction, {request: post('/account/addresses', base), context: ctx(makeAccount({mutate}))});
      expect(result.success).toBe(false);
    }
  });

  it('rejects cross-origin submissions and signed-out visitors', async () => {
    const account = makeAccount();
    expect((await run(addressesAction, {request: post('/account/addresses', base, {Origin: 'https://evil.test'}), context: ctx(account)})).status).toBe(403);
    const signedOut = makeAccount({isLoggedIn: vi.fn(async () => false)});
    expect((await run(addressesAction, {request: post('/account/addresses', base), context: ctx(signedOut)})).status).toBe(302);
    expect(account.mutate).not.toHaveBeenCalled();
  });
});

describe('sign in and out', () => {
  it('a GET to logout never signs anyone out', async () => {
    const account = makeAccount();
    const response = await run(logoutLoader, {request: get('/account/logout'), context: ctx(account)});
    expect(response.status).toBe(302);
    expect(response.headers.get('Location')).toBe('/account');
    expect(account.logout).not.toHaveBeenCalled();
  });

  it('a same-origin POST signs out; a cross-origin POST does not', async () => {
    const account = makeAccount();
    await run(logoutAction, {request: post('/account/logout', {}), context: ctx(account)});
    expect(account.logout).toHaveBeenCalledWith({postLogoutRedirectUri: '/'});
    const blocked = await run(logoutAction, {request: post('/account/logout', {}, {Origin: 'https://evil.test'}), context: ctx(account)});
    expect(blocked.status).toBe(403);
    expect(account.logout).toHaveBeenCalledTimes(1);
  });

  it('the callback sends a failed exchange (rejected promise) to the retry page, not a 500', async () => {
    const account = makeAccount({authorize: vi.fn(async () => { throw new Error('bad code'); })});
    const response = await run(authorizeLoader, {request: get('/account/authorize?code=x'), context: ctx(account)});
    expect(response.status).toBe(302);
    expect(response.headers.get('Location')).toBe('/account/login?error=auth_failed');
  });

  it('a successful callback returns the redirect the SDK built', async () => {
    const response = await run(authorizeLoader, {request: get('/account/authorize?code=x'), context: ctx(makeAccount())});
    expect(response.headers.get('Location')).toBe('/account');
  });

  it('login starts the flow, skips it when signed in, and stops instead of looping after a failure', async () => {
    const account = makeAccount({isLoggedIn: vi.fn(async () => false)});
    expect((await run(loginLoader, {request: get('/account/login'), context: ctx(account)})).headers.get('Location')).toBe('https://shopify.test/login');
    expect(account.login).toHaveBeenCalledTimes(1);

    const signedIn = makeAccount();
    expect((await run(loginLoader, {request: get('/account/login'), context: ctx(signedIn)})).headers.get('Location')).toBe('/account');

    const failed = makeAccount({isLoggedIn: vi.fn(async () => false)});
    expect(await run(loginLoader, {request: get('/account/login?error=auth_failed'), context: ctx(failed)})).toEqual({authFailed: true});
    expect(failed.login).not.toHaveBeenCalled();
  });
});

describe('private meta', () => {
  const robots = (entries: unknown) => (entries as Array<{name?: string; content?: string}>).find((m) => m.name === 'robots');

  it.each([
    ['layout', layoutMeta],
    ['index', indexMeta],
    ['orders', ordersMeta],
    ['addresses', addressesMeta],
    ['edit', editMeta],
    ['register', registerMeta],
    ['authorize', authorizeMeta],
  ])('%s carries noindex and no public canonical', (_name, meta) => {
    const entries = (meta as unknown as () => unknown[])();
    expect(robots(entries)?.content).toBe('noindex, nofollow');
    expect((entries as Array<{rel?: string}>).some((m) => m.rel === 'canonical')).toBe(false);
  });
});

beforeEach(() => vi.spyOn(console, 'error').mockImplementation(() => {}));
afterEach(() => vi.restoreAllMocks());
