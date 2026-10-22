import {describe, expect, it, vi} from 'vitest';
import {action} from '~/routes/api.market';
import {createMockStorefront} from '~/test/mock-storefront';

const localization = {
  localization: {
    country: {isoCode: 'US', name: 'United States', currency: {isoCode: 'USD', symbol: '$'}},
    language: {isoCode: 'EN', name: 'English', endonymName: 'English'},
    availableCountries: [
      {isoCode: 'US', name: 'United States', currency: {isoCode: 'USD', symbol: '$'}},
      {isoCode: 'ES', name: 'Spain', currency: {isoCode: 'EUR', symbol: '€'}},
    ],
    availableLanguages: [
      {isoCode: 'EN', name: 'English', endonymName: 'English'},
      {isoCode: 'ES', name: 'Spanish', endonymName: 'Español'},
    ],
  },
};

describe('api.market action', () => {
  it('persists a Shopify-supported language and country before reloading', async () => {
    const mockStorefront = createMockStorefront({
      responses: {StorefrontLocalization: localization},
    });
    const set = vi.fn();
    const context = mockStorefront.createContext({
      session: {
        get: () => null,
        set,
        unset: () => {},
        commit: async () => 'session=updated',
        isPending: true,
      },
      cart: {getCartId: async () => null},
    });
    const request = new Request('http://localhost/api/market', {
      method: 'POST',
      headers: {Origin: 'http://localhost'},
      body: new URLSearchParams({country: 'ES', language: 'ES'}),
    });

    // @ts-expect-error - minimal Hydrogen app context
    const response = await action({request, context, params: {}});

    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({success: true, country: 'ES', language: 'ES'});
    expect(set).toHaveBeenCalledWith('country', 'ES');
    expect(set).toHaveBeenCalledWith('language', 'ES');
    expect(response.headers.get('Set-Cookie')).toBe('session=updated');
  });

  it('rejects a well-formed language that Shopify does not make available', async () => {
    const mockStorefront = createMockStorefront({
      responses: {StorefrontLocalization: localization},
    });
    const context = mockStorefront.createContext({cart: {getCartId: async () => null}});
    const request = new Request('http://localhost/api/market', {
      method: 'POST',
      headers: {Origin: 'http://localhost'},
      body: new URLSearchParams({country: 'US', language: 'FR'}),
    });

    // @ts-expect-error - minimal Hydrogen app context
    const response = await action({request, context, params: {}});

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({error: 'Language is not available for this storefront'});
  });

  describe('with an existing cart', () => {
    function setup(updateBuyerIdentity: () => Promise<unknown>) {
      const set = vi.fn();
      const context = createMockStorefront({responses: {StorefrontLocalization: localization}}).createContext({
        session: {get: () => null, set, unset: () => {}, commit: async () => 'session=updated', isPending: false},
        cart: {
          getCartId: async () => 'gid://shopify/Cart/old',
          updateBuyerIdentity,
          setCartId: (id: string) => new Headers({'Set-Cookie': `cart=${id}`}),
        },
      });
      const request = new Request('http://localhost/api/market', {
        method: 'POST',
        headers: {Origin: 'http://localhost'},
        body: new URLSearchParams({country: 'ES', language: 'ES'}),
      });
      return {set, run: () => action({request, context, params: {}} as never)};
    }

    it('keeps the previous market when Shopify rejects the cart update', async () => {
      const {set, run} = setup(async () => ({cart: {id: 'gid://shopify/Cart/old'}, errors: [{message: 'nope'}]}));
      const response = await run();
      expect(response.status).toBe(409);
      expect(set).not.toHaveBeenCalled();
      expect(response.headers.get('Set-Cookie')).toBeNull();
      expect(JSON.stringify(await response.json())).not.toContain('nope');
    });

    it('recovers from an expired cart: clears the dead cart cookie and still applies the selection', async () => {
      const {set, run} = setup(async () => ({cart: null, errors: []}));
      const response = await run();
      expect(response.status).toBe(200);
      expect(set).toHaveBeenCalledWith('country', 'ES');
      expect(set).toHaveBeenCalledWith('language', 'ES');
      const cookies = response.headers.getSetCookie();
      expect(cookies).toContain('session=updated');
      expect(cookies.some((c) => c.startsWith('cart=;') && c.includes('Max-Age=0'))).toBe(true);
      expect((await response.json()).cart).toBeNull();
    });

    it('keeps the previous market when the cart update throws', async () => {
      const {set, run} = setup(async () => {
        throw new Error('upstream stack trace');
      });
      const response = await run();
      expect(response.status).toBe(409);
      expect(set).not.toHaveBeenCalled();
    });

    it('commits the session and the returned cart id together on success', async () => {
      const {set, run} = setup(async () => ({cart: {id: 'gid://shopify/Cart/new'}, errors: []}));
      const response = await run();
      expect(response.status).toBe(200);
      expect(set).toHaveBeenCalledWith('country', 'ES');
      expect(set).toHaveBeenCalledWith('language', 'ES');
      expect(response.headers.getSetCookie()).toEqual(['cart=gid://shopify/Cart/new', 'session=updated']);
    });
  });
});
