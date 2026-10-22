import {describe, expect, it, vi} from 'vitest';
import {CartForm} from '@shopify/hydrogen';
import {action, loader} from '~/routes/cart';
import {createMockStorefront} from '~/test/mock-storefront';

const cartResult = {
  cart: {id: 'gid://shopify/Cart/test', totalQuantity: 2},
  errors: [],
  warnings: [],
};

function makeRequest(actionName: string, inputs: Record<string, unknown>, origin = 'http://localhost') {
  const body = new FormData();
  body.set('cartFormInput', JSON.stringify({action: actionName, inputs}));
  return new Request('http://localhost/cart', {
    method: 'POST',
    headers: {Origin: origin},
    body,
  });
}

function createContext(cart: Record<string, unknown>) {
  return createMockStorefront().createContext({cart});
}

function createCart(overrides: Record<string, unknown> = {}) {
  return {
    get: vi.fn(),
    addLines: vi.fn(async () => cartResult),
    updateLines: vi.fn(async () => cartResult),
    removeLines: vi.fn(async () => cartResult),
    updateDiscountCodes: vi.fn(async () => cartResult),
    setCartId: vi.fn(() => new Headers({'Set-Cookie': 'cart=test'})),
    ...overrides,
  };
}

describe('cart action', () => {
  it('rejects a cross-origin cart mutation', async () => {
    const cart = createCart();
    const request = makeRequest(
      CartForm.ACTIONS.LinesAdd,
      {lines: [{merchandiseId: 'gid://shopify/ProductVariant/1', quantity: 1}]},
      'https://attacker.example',
    );

    // @ts-expect-error - minimal Hydrogen app context
    const response = await action({request, context: createContext(cart), params: {}});

    expect(response.status).toBe(403);
    expect(cart.addLines).not.toHaveBeenCalled();
  });

  it('adds cart lines and persists the returned cart ID', async () => {
    const lines = [{merchandiseId: 'gid://shopify/ProductVariant/1', quantity: 2}];
    const cart = createCart();

    // @ts-expect-error - minimal Hydrogen app context
    const response = await action({
      request: makeRequest(CartForm.ACTIONS.LinesAdd, {lines}),
      context: createContext(cart),
      params: {},
    });

    expect(response.status).toBe(200);
    expect(cart.addLines).toHaveBeenCalledWith(lines);
    expect(cart.setCartId).toHaveBeenCalledWith(cartResult.cart.id);
    expect(response.headers.get('Set-Cookie')).toBe('cart=test');
    expect(await response.json()).toMatchObject({cart: cartResult.cart, errors: [], warnings: []});
  });

  it('updates line quantities', async () => {
    const lines = [{id: 'gid://shopify/CartLine/1', quantity: 3}];
    const cart = createCart();

    // @ts-expect-error - minimal Hydrogen app context
    const response = await action({
      request: makeRequest(CartForm.ACTIONS.LinesUpdate, {lines}),
      context: createContext(cart),
      params: {},
    });

    expect(response.status).toBe(200);
    expect(cart.updateLines).toHaveBeenCalledWith(lines);
  });

  it('removes cart lines', async () => {
    const lineIds = ['gid://shopify/CartLine/1'];
    const cart = createCart();

    // @ts-expect-error - minimal Hydrogen app context
    const response = await action({
      request: makeRequest(CartForm.ACTIONS.LinesRemove, {lineIds}),
      context: createContext(cart),
      params: {},
    });

    expect(response.status).toBe(200);
    expect(cart.removeLines).toHaveBeenCalledWith(lineIds);
  });

  it('trims and removes blank discount codes', async () => {
    const cart = createCart();

    // @ts-expect-error - minimal Hydrogen app context
    const response = await action({
      request: makeRequest(CartForm.ACTIONS.DiscountCodesUpdate, {
        discountCodes: [' SAVE10 ', '', '  ', ' SAVE20'],
      }),
      context: createContext(cart),
      params: {},
    });

    expect(response.status).toBe(200);
    expect(cart.updateDiscountCodes).toHaveBeenCalledWith(['SAVE10', 'SAVE20']);
  });

  it('rejects unsupported cart actions', async () => {
    const cart = createCart();

    // @ts-expect-error - minimal Hydrogen app context
    const response = await action({
      request: makeRequest('unsupported-action', {}),
      context: createContext(cart),
      params: {},
    });

    expect(response.status).toBe(400);
    expect(cart.addLines).not.toHaveBeenCalled();
    expect(cart.updateLines).not.toHaveBeenCalled();
    expect(cart.removeLines).not.toHaveBeenCalled();
    expect(cart.updateDiscountCodes).not.toHaveBeenCalled();
  });

  it('returns the current cart from the loader', async () => {
    const cart = createCart({get: vi.fn(async () => cartResult.cart)});

    // @ts-expect-error - minimal Hydrogen app context
    const data = await loader({context: createContext(cart), params: {}, request: new Request('http://localhost/cart')});

    expect(cart.get).toHaveBeenCalledOnce();
    expect(data).toMatchObject({cart: cartResult.cart});
  });
});
