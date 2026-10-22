import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest';
import {loader} from '~/root';
import {createMockStorefront} from '~/test/mock-storefront';

const localization = {
  localization: {
    country: {isoCode: 'US', name: 'United States', currency: {isoCode: 'USD', symbol: '$'}},
    language: {isoCode: 'EN', name: 'English', endonymName: 'English'},
    availableCountries: [{isoCode: 'US', name: 'United States', currency: {isoCode: 'USD', symbol: '$'}}],
    availableLanguages: [{isoCode: 'EN', name: 'English', endonymName: 'English'}],
  },
};
const menu = {menu: {items: [{id: '1', title: 'Shop', type: 'COLLECTION', resourceId: 'gid://shopify/Collection/1', url: '/collections/all'}]}};
const navCollections = {nodes: [{id: 'gid://shopify/Collection/1', title: 'Shop', handle: 'shop', image: null}]};
const published = {collections: {nodes: [], pageInfo: {hasNextPage: false, endCursor: null}}};
const trust = {shop: null};
const cartData = {id: 'gid://shopify/Cart/1', totalQuantity: 2, lines: {edges: []}};

type Overrides = {
  url?: string;
  env?: Record<string, string>;
  responses?: Record<string, unknown>;
  cart?: () => Promise<unknown>;
  isLoggedIn?: () => Promise<boolean>;
};

function run({responses = {}, cart = async () => cartData, isLoggedIn = async () => false, url = 'http://localhost/', env = {}}: Overrides = {}) {
  const mock = createMockStorefront({
    responses: {
      StorefrontLocalization: localization,
      MainMenu: menu,
      NavCollections: navCollections,
      NavAllCollections: published,
      StoreTrust: trust,
      ...responses,
    },
  });
  const context = mock.createContext({
    cart: {get: cart, getCartId: async () => 'gid://shopify/Cart/1'},
    customerAccount: {isLoggedIn},
    env: {PUBLIC_STORE_DOMAIN: 'shop.test', ...env},
  });
  // @ts-expect-error - minimal Hydrogen app context
  return loader({request: new Request(url), context, params: {}});
}

const fails = () => {
  throw new Error('upstream failure');
};

describe('root loader resilience', () => {
  let consoleError: ReturnType<typeof vi.spyOn>;
  beforeEach(() => {
    consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
  });
  afterEach(() => {
    consoleError.mockRestore();
    vi.useRealTimers();
  });

  it('renders normally when everything is healthy', async () => {
    const data = await run();
    expect(data.cart).toEqual(cartData);
    expect(data.navCollections.length).toBeGreaterThan(0);
    expect(data.isLoggedIn).toBe(false);
  });

  it.each([
    ['the cart lookup', {cart: async () => fails()}],
    ['the main menu', {responses: {MainMenu: fails}}],
    ['the menu collection lookup', {responses: {NavCollections: fails}}],
    ['the published collections lookup', {responses: {NavAllCollections: fails}}],
    ['the store trust lookup', {responses: {StoreTrust: fails}}],
  ] as [string, Overrides][])('still serves the page when %s fails', async (_name, overrides) => {
    const data = await run(overrides);
    expect(data.localization.country.isoCode).toBe('US');
    expect(data).toHaveProperty('navCollections');
  });

  it('falls back to an empty cart and empty navigation when those dependencies fail', async () => {
    const data = await run({cart: async () => fails(), responses: {MainMenu: fails, NavAllCollections: fails}});
    expect(data.cart).toBeNull();
    expect(data.navCollections).toEqual([]);
  });

  it('offers the chat widget only when its provider is configured', async () => {
    const off = (await run()) as {chatAvailable: boolean};
    const on = (await run({env: {PRIVATE_ANTHROPIC_API_KEY: 'key'}})) as {chatAvailable: boolean};
    expect(off.chatAvailable).toBe(false);
    expect(on.chatAvailable).toBe(true);
  });

  it('treats a failing auth lookup as signed out, never as another customer', async () => {
    const data = await run({isLoggedIn: async () => fails()});
    expect(data.isLoggedIn).toBe(false);
  });

  it('does not wait forever on a stalled optional dependency', async () => {
    vi.useFakeTimers();
    const pending = run({cart: () => new Promise(() => {}), responses: {MainMenu: () => new Promise(() => {})}});
    await vi.advanceTimersByTimeAsync(3_500);
    const data = await pending;
    expect(data.cart).toBeNull();
    expect(data.navCollections).toEqual([]);
  });

  it('still fails the request when critical localization is unavailable (a wrong currency would be worse)', async () => {
    await expect(run({responses: {StorefrontLocalization: fails}})).rejects.toThrow('upstream failure');
  });
});
