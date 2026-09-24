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
});
