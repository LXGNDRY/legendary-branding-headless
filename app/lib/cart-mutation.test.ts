import {describe, it, expect, vi} from 'vitest';
import {CartForm, type HydrogenCart} from '@shopify/hydrogen';
import {handleCartMutation} from './cart-mutation';

const ALL = [
  CartForm.ACTIONS.LinesAdd,
  CartForm.ACTIONS.LinesUpdate,
  CartForm.ACTIONS.LinesRemove,
  CartForm.ACTIONS.DiscountCodesUpdate,
] as const;

function makeRequest(body: string | FormData, origin?: string) {
  return new Request('https://shop.test/cart', {
    method: 'POST',
    body,
    headers: origin ? {Origin: origin} : undefined,
  });
}

function formFor(action: string, inputs: Record<string, unknown>) {
  const fd = new FormData();
  fd.set(CartForm.INPUT_NAME, JSON.stringify({action, inputs}));
  return fd;
}

function makeCart(result: unknown) {
  const mutate = vi.fn(async () => result);
  const cart = {
    addLines: mutate,
    updateLines: mutate,
    removeLines: mutate,
    updateDiscountCodes: mutate,
    setCartId: vi.fn((id: string) => new Headers({'Set-Cookie': `cart=${id}`})),
  };
  return {cart: cart as unknown as HydrogenCart, mutate, setCartId: cart.setCartId};
}

const okCart = {cart: {id: 'gid://shopify/Cart/1'}, errors: [], warnings: []};
const addInput = {lines: [{merchandiseId: 'gid://shopify/ProductVariant/1', quantity: 1}]};

async function run(cart: HydrogenCart, body: string | FormData, allowed = ALL, origin?: string) {
  const res = await handleCartMutation({request: makeRequest(body, origin), cart, allowed});
  return {res, json: res.headers.get('content-type')?.includes('json') ? await res.clone().json() : null};
}

describe('handleCartMutation', () => {
  it('returns the cart and sets the cart cookie on success', async () => {
    const {cart, setCartId} = makeCart(okCart);
    const {res, json} = await run(cart, formFor(CartForm.ACTIONS.LinesAdd, addInput));
    expect(res.status).toBe(200);
    expect(json.cart.id).toBe('gid://shopify/Cart/1');
    expect(setCartId).toHaveBeenCalledWith('gid://shopify/Cart/1');
    expect(res.headers.get('Set-Cookie')).toBe('cart=gid://shopify/Cart/1');
  });

  it('does not throw or set a cookie when Shopify returns a null cart', async () => {
    const {cart, setCartId} = makeCart({cart: null, errors: [{message: 'Not enough stock'}]});
    const {res, json} = await run(cart, formFor(CartForm.ACTIONS.LinesAdd, addInput));
    expect(res.status).toBe(422);
    expect(json.cart).toBeNull();
    expect(json.errors[0].message).toBe('Not enough stock');
    expect(setCartId).not.toHaveBeenCalled();
    expect(res.headers.get('Set-Cookie')).toBeNull();
  });

  it('gives a generic error when the cart is null with no provider errors', async () => {
    const {cart} = makeCart(undefined);
    const {res, json} = await run(cart, formFor(CartForm.ACTIONS.LinesRemove, {lineIds: ['gid://shopify/CartLine/1']}));
    expect(res.status).toBe(422);
    expect(json.errors[0].message).toMatch(/cart is unavailable/i);
  });

  it('returns a controlled 502 when the provider throws, without leaking the error', async () => {
    const {cart, mutate} = makeCart(null);
    mutate.mockRejectedValueOnce(new Error('secret upstream stack'));
    const {res, json} = await run(cart, formFor(CartForm.ACTIONS.LinesAdd, addInput));
    expect(res.status).toBe(502);
    expect(JSON.stringify(json)).not.toContain('secret upstream');
  });

  it('passes provider user errors and warnings through with the cart', async () => {
    const {cart} = makeCart({
      cart: {id: 'gid://shopify/Cart/1'},
      errors: [{message: 'Quantity reduced'}],
      warnings: [{message: 'Low stock'}],
    });
    const {res, json} = await run(cart, formFor(CartForm.ACTIONS.LinesUpdate, {lines: [{id: 'l1', quantity: 1}]}));
    expect(res.status).toBe(200);
    expect(json.errors).toHaveLength(1);
    expect(json.warnings).toHaveLength(1);
  });

  it.each([
    ['non-form body', 'not a form'],
    ['bad JSON', (() => { const fd = new FormData(); fd.set(CartForm.INPUT_NAME, '{nope'); return fd; })()],
    ['missing input', new FormData()],
  ])('rejects malformed request: %s', async (_name, body) => {
    const {cart, mutate} = makeCart(okCart);
    const {res} = await run(cart, body as string | FormData);
    expect(res.status).toBe(400);
    expect(mutate).not.toHaveBeenCalled();
  });

  it.each([
    ['add: missing lines', CartForm.ACTIONS.LinesAdd, {}],
    ['add: empty lines', CartForm.ACTIONS.LinesAdd, {lines: []}],
    ['add: zero quantity', CartForm.ACTIONS.LinesAdd, {lines: [{merchandiseId: 'x', quantity: 0}]}],
    ['add: fractional quantity', CartForm.ACTIONS.LinesAdd, {lines: [{merchandiseId: 'x', quantity: 1.5}]}],
    ['add: huge quantity', CartForm.ACTIONS.LinesAdd, {lines: [{merchandiseId: 'x', quantity: 100000}]}],
    ['add: non-string id', CartForm.ACTIONS.LinesAdd, {lines: [{merchandiseId: 5, quantity: 1}]}],
    ['update: negative quantity', CartForm.ACTIONS.LinesUpdate, {lines: [{id: 'l', quantity: -1}]}],
    ['remove: not an array', CartForm.ACTIONS.LinesRemove, {lineIds: 'l1'}],
    ['remove: non-string ids', CartForm.ACTIONS.LinesRemove, {lineIds: [1]}],
    ['discount: not an array', CartForm.ACTIONS.DiscountCodesUpdate, {discountCodes: 'SAVE'}],
    ['discount: non-string code', CartForm.ACTIONS.DiscountCodesUpdate, {discountCodes: [1]}],
    ['discount: overlong code', CartForm.ACTIONS.DiscountCodesUpdate, {discountCodes: ['x'.repeat(65)]}],
  ])('rejects invalid input before calling Shopify: %s', async (_name, action, inputs) => {
    const {cart, mutate} = makeCart(okCart);
    const {res} = await run(cart, formFor(action, inputs));
    expect(res.status).toBe(400);
    expect(mutate).not.toHaveBeenCalled();
  });

  it('allows clearing discount codes and trims submitted codes', async () => {
    const {cart, mutate} = makeCart(okCart);
    const {res} = await run(cart, formFor(CartForm.ACTIONS.DiscountCodesUpdate, {discountCodes: [' SAVE ', '  ']}));
    expect(res.status).toBe(200);
    expect(mutate).toHaveBeenCalledWith(['SAVE']);
  });

  it('rejects actions a route does not allow', async () => {
    const {cart, mutate} = makeCart(okCart);
    const {res} = await run(cart, formFor(CartForm.ACTIONS.LinesRemove, {lineIds: ['l1']}), [CartForm.ACTIONS.LinesAdd]);
    expect(res.status).toBe(400);
    expect(mutate).not.toHaveBeenCalled();
  });

  it('rejects cross-origin requests', async () => {
    const {cart, mutate} = makeCart(okCart);
    const {res} = await run(cart, formFor(CartForm.ACTIONS.LinesAdd, addInput), ALL, 'https://evil.test');
    expect(res.status).toBe(403);
    expect(mutate).not.toHaveBeenCalled();
  });
});
