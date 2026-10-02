import {describe, it, expect, vi, afterEach} from 'vitest';
import {fetchActiveDiscounts} from './discounts';

describe('fetchActiveDiscounts', () => {
  const originalFetch = global.fetch;

  afterEach(() => {
    global.fetch = originalFetch;
    vi.restoreAllMocks();
  });

  it('degrades to an empty list when the request fails (never breaks the page)', async () => {
    global.fetch = vi.fn().mockRejectedValue(new Error('network down'));
    const discounts = await fetchActiveDiscounts({accessToken: 'x', shopDomain: 'test.myshopify.com'});
    expect(discounts).toEqual([]);
  });

  it('degrades to an empty list on a non-OK response', async () => {
    global.fetch = vi.fn().mockResolvedValue(new Response('', {status: 401}));
    const discounts = await fetchActiveDiscounts({accessToken: 'x', shopDomain: 'test.myshopify.com'});
    expect(discounts).toEqual([]);
  });

  it('degrades to an empty list when the Admin API returns GraphQL errors', async () => {
    const body = JSON.stringify({errors: [{message: 'Access denied for discountNodes field.'}]});
    global.fetch = vi.fn().mockResolvedValue(new Response(body, {status: 200}));
    const discounts = await fetchActiveDiscounts({accessToken: 'x', shopDomain: 'test.myshopify.com'});
    expect(discounts).toEqual([]);
  });

  it('includes automatic discounts unconditionally', async () => {
    const body = JSON.stringify({
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
    });
    global.fetch = vi.fn().mockResolvedValue(new Response(body, {status: 200}));
    const discounts = await fetchActiveDiscounts({accessToken: 'x', shopDomain: 'test.myshopify.com'});
    expect(discounts).toEqual([
      {id: 'gid://shopify/DiscountAutomaticNode/1', title: '25% off Outerwear', summary: '25% off Outerwear', kind: 'automatic'},
    ]);
  });

  it('includes a storewide code discount (DiscountCustomerAll)', async () => {
    const body = JSON.stringify({
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
    });
    global.fetch = vi.fn().mockResolvedValue(new Response(body, {status: 200}));
    const discounts = await fetchActiveDiscounts({accessToken: 'x', shopDomain: 'test.myshopify.com'});
    expect(discounts).toEqual([
      {id: 'gid://shopify/DiscountCodeNode/2', title: 'Welcome_20', summary: '20% off entire order', kind: 'code', code: 'WELCOME_20'},
    ]);
  });

  // Regression guard: a code discount generated for one named customer
  // (e.g. an abandoned-cart or win-back code) must never be advertised to
  // every site visitor -- it is not a public promotion.
  it('excludes a code discount restricted to specific customers', async () => {
    const body = JSON.stringify({
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
    });
    global.fetch = vi.fn().mockResolvedValue(new Response(body, {status: 200}));
    const discounts = await fetchActiveDiscounts({accessToken: 'x', shopDomain: 'test.myshopify.com'});
    expect(discounts).toEqual([]);
  });

  it('skips unrecognized discount node types rather than throwing', async () => {
    const body = JSON.stringify({
      data: {
        discountNodes: {
          nodes: [{id: 'gid://shopify/DiscountNode/4', discount: {__typename: 'DiscountRedeemCodeFreeShipping'}}],
        },
      },
    });
    global.fetch = vi.fn().mockResolvedValue(new Response(body, {status: 200}));
    const discounts = await fetchActiveDiscounts({accessToken: 'x', shopDomain: 'test.myshopify.com'});
    expect(discounts).toEqual([]);
  });
});
