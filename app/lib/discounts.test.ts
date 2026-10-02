import {describe, it, expect} from 'vitest';
import {fetchActiveDiscounts} from './discounts';
import type {WithCache} from '@shopify/hydrogen';

/**
 * Minimal mock of Hydrogen's `WithCache.fetch` -- just enough to exercise
 * fetchActiveDiscounts's own parsing/filtering logic without needing a real
 * Cache API instance or network call. `fetchActiveDiscounts` only calls
 * `.fetch`, never `.run`, so that's the only method mocked here.
 */
function mockWithCache(result: {data: unknown} | {throws: Error}): WithCache {
  return {
    run: async () => {
      throw new Error('not used by fetchActiveDiscounts');
    },
    fetch: async () => {
      if ('throws' in result) throw result.throws;
      return {data: result.data as never, response: new Response()};
    },
  };
}

describe('fetchActiveDiscounts', () => {
  it('degrades to an empty list when the request fails (never breaks the page)', async () => {
    const discounts = await fetchActiveDiscounts({
      accessToken: 'x',
      shopDomain: 'test.myshopify.com',
      withCache: mockWithCache({throws: new Error('network down')}),
    });
    expect(discounts).toEqual([]);
  });

  it('degrades to an empty list when no data comes back', async () => {
    const discounts = await fetchActiveDiscounts({
      accessToken: 'x',
      shopDomain: 'test.myshopify.com',
      withCache: mockWithCache({data: null}),
    });
    expect(discounts).toEqual([]);
  });

  it('degrades to an empty list when the Admin API returns GraphQL errors', async () => {
    const discounts = await fetchActiveDiscounts({
      accessToken: 'x',
      shopDomain: 'test.myshopify.com',
      withCache: mockWithCache({data: {errors: [{message: 'Access denied for discountNodes field.'}]}}),
    });
    expect(discounts).toEqual([]);
  });

  it('includes automatic discounts unconditionally', async () => {
    const discounts = await fetchActiveDiscounts({
      accessToken: 'x',
      shopDomain: 'test.myshopify.com',
      withCache: mockWithCache({
        data: {
          data: {
            discountNodes: {
              nodes: [
                {
                  id: 'gid://shopify/DiscountAutomaticNode/1',
                  discount: {
                    __typename: 'DiscountAutomaticBasic',
                    title: '25% off Outerwear',
                    summary: '25% off Outerwear',
                  },
                },
              ],
            },
          },
        },
      }),
    });
    expect(discounts).toEqual([
      {id: 'gid://shopify/DiscountAutomaticNode/1', title: '25% off Outerwear', summary: '25% off Outerwear', kind: 'automatic'},
    ]);
  });

  it('includes an automatic free-shipping discount', async () => {
    const discounts = await fetchActiveDiscounts({
      accessToken: 'x',
      shopDomain: 'test.myshopify.com',
      withCache: mockWithCache({
        data: {
          data: {
            discountNodes: {
              nodes: [
                {
                  id: 'gid://shopify/DiscountAutomaticNode/5',
                  discount: {
                    __typename: 'DiscountAutomaticFreeShipping',
                    title: 'Free Shipping',
                    summary: 'Free shipping on all products',
                  },
                },
              ],
            },
          },
        },
      }),
    });
    expect(discounts).toEqual([
      {id: 'gid://shopify/DiscountAutomaticNode/5', title: 'Free Shipping', summary: 'Free shipping on all products', kind: 'automatic'},
    ]);
  });

  it('includes a storewide code discount (DiscountCustomerAll)', async () => {
    const discounts = await fetchActiveDiscounts({
      accessToken: 'x',
      shopDomain: 'test.myshopify.com',
      withCache: mockWithCache({
        data: {
          data: {
            discountNodes: {
              nodes: [
                {
                  id: 'gid://shopify/DiscountCodeNode/2',
                  discount: {
                    __typename: 'DiscountCodeBasic',
                    title: 'Welcome_20',
                    summary: '20% off entire order',
                    customerSelection: {__typename: 'DiscountCustomerAll'},
                    codes: {nodes: [{code: 'WELCOME_20'}]},
                  },
                },
              ],
            },
          },
        },
      }),
    });
    expect(discounts).toEqual([
      {id: 'gid://shopify/DiscountCodeNode/2', title: 'Welcome_20', summary: '20% off entire order', kind: 'code', code: 'WELCOME_20'},
    ]);
  });

  // Regression guard: a code discount generated for one named customer
  // (e.g. an abandoned-cart or win-back code) must never be advertised to
  // every site visitor -- it is not a public promotion.
  it('excludes a code discount restricted to specific customers', async () => {
    const discounts = await fetchActiveDiscounts({
      accessToken: 'x',
      shopDomain: 'test.myshopify.com',
      withCache: mockWithCache({
        data: {
          data: {
            discountNodes: {
              nodes: [
                {
                  id: 'gid://shopify/DiscountCodeNode/3',
                  discount: {
                    __typename: 'DiscountCodeBasic',
                    title: 'IG-EMAIL-YMR5I2KP',
                    summary: '20% off entire order',
                    customerSelection: {__typename: 'DiscountCustomers'},
                    codes: {nodes: [{code: 'IG-EMAIL-YMR5I2KP'}]},
                  },
                },
              ],
            },
          },
        },
      }),
    });
    expect(discounts).toEqual([]);
  });

  // Regression guard: DiscountCustomerAll describes WHO can redeem a code
  // discount, not whether it's a single shared code safe to broadcast
  // sitewide versus a bulk-generated campaign (e.g. affiliate codes) where
  // publishing one arbitrary code would let it be exhausted or wrongly
  // attributed. Querying 2 codes and requiring exactly 1 total distinguishes
  // the two without a dedicated "is bulk" field.
  it('excludes a storewide code discount that has multiple bulk-generated codes', async () => {
    const discounts = await fetchActiveDiscounts({
      accessToken: 'x',
      shopDomain: 'test.myshopify.com',
      withCache: mockWithCache({
        data: {
          data: {
            discountNodes: {
              nodes: [
                {
                  id: 'gid://shopify/DiscountCodeNode/6',
                  discount: {
                    __typename: 'DiscountCodeBasic',
                    title: 'Affiliate campaign',
                    summary: '15% off entire order',
                    customerSelection: {__typename: 'DiscountCustomerAll'},
                    codes: {nodes: [{code: 'AFF-0001'}, {code: 'AFF-0002'}]},
                  },
                },
              ],
            },
          },
        },
      }),
    });
    expect(discounts).toEqual([]);
  });

  // Regression guard: querying unsupported fields on an app-managed
  // discount type breaks the entire request (one GraphQL operation), so
  // app discounts are deliberately never queried for title/summary at
  // all -- any node reporting one of those typenames must be a stray
  // response shape change, not something the parser tries to read fields
  // from.
  it('skips unrecognized discount node types rather than throwing', async () => {
    const discounts = await fetchActiveDiscounts({
      accessToken: 'x',
      shopDomain: 'test.myshopify.com',
      withCache: mockWithCache({
        data: {
          data: {
            discountNodes: {
              nodes: [{id: 'gid://shopify/DiscountNode/4', discount: {__typename: 'DiscountAutomaticApp'}}],
            },
          },
        },
      }),
    });
    expect(discounts).toEqual([]);
  });
});
