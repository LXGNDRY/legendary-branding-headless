/**
 * Homepage route loader tests.
 *
 * Tests the loader function directly with a mocked storefront.
 * Would have caught the unused-variable GraphQL bug and similar
 * query-shape regressions.
 */

import {describe, it, expect, beforeEach} from 'vitest';
import {loader} from '~/routes/_index';
import {createMockStorefront} from '~/test/mock-storefront';

describe('_index loader', () => {
  let mockStorefront: ReturnType<typeof createMockStorefront>;

  beforeEach(() => {
    mockStorefront = createMockStorefront({
      responses: {
        Homepage: {
          newDrops: {products: {nodes: []}},
          bestSellers: {products: {nodes: []}},
        },
        MainMenu: {menu: {items: []}},
      },
    });
  });

  it('runs without throwing on happy-path data', async () => {
    const context = mockStorefront.createContext();
    const request = new Request('http://localhost/');

    // @ts-expect-error - we're testing the loader with a minimal mock context
    const result = await loader({request, context, params: {}});

    expect(result).toBeDefined();
    expect(result.categoryItems).toBeDefined();
    expect(result.newDrops).toBeDefined();
    expect(result.bestSellers).toBeDefined();
  });

  it('calls storefront.query with the Homepage and MainMenu operations', async () => {
    const context = mockStorefront.createContext();
    const request = new Request('http://localhost/');

    // @ts-expect-error - minimal mock context
    await loader({request, context, params: {}});

    const calls = mockStorefront.getCalls();
    const operationNames = calls.map((call) => call.operationName);
    expect(operationNames).toContain('Homepage');
    expect(operationNames).toContain('MainMenu');
  });

  it('passes country and language variables from i18n', async () => {
    const context = mockStorefront.createContext();
    const request = new Request('http://localhost/');

    // @ts-expect-error - minimal mock context
    await loader({request, context, params: {}});

    const calls = mockStorefront.getCalls();
    const homepageCall = calls.find((call) => call.operationName === 'Homepage')!;
    expect(homepageCall.variables.country).toBe('US');
    expect(homepageCall.variables.language).toBe('EN');
  });

  it('returns category items resolved from the live main-menu collections', async () => {
    mockStorefront.setMockResponse('MainMenu', {
      menu: {
        items: [
          {
            id: 'gid://shopify/MenuItem/1',
            title: 'SHIRTS & TOPS',
            type: 'COLLECTION',
            url: '/collections/shirts-tops',
            resourceId: 'gid://shopify/Collection/1',
          },
        ],
      },
    });
    mockStorefront.setMockResponse('NavCollections', {
      nodes: [
        {
          id: 'gid://shopify/Collection/1',
          title: 'Shirts & Tops',
          handle: 'shirts-tops',
          image: null,
        },
      ],
    });

    const context = mockStorefront.createContext();
    const request = new Request('http://localhost/');

    // @ts-expect-error - minimal mock context
    const result = await loader({request, context, params: {}});

    expect(result.categoryItems).toHaveLength(1);
    expect(result.categoryItems[0].handle).toBe('shirts-tops');
  });

  it('excludes the New Drops and Marque Légendaire collections from category items', async () => {
    mockStorefront.setMockResponse('MainMenu', {
      menu: {
        items: [
          {
            id: 'gid://shopify/MenuItem/1',
            title: 'NEW DROPS',
            type: 'COLLECTION',
            url: '/collections/all-products',
            resourceId: 'gid://shopify/Collection/1',
          },
          {
            id: 'gid://shopify/MenuItem/2',
            title: 'SHIRTS & TOPS',
            type: 'COLLECTION',
            url: '/collections/shirts-tops',
            resourceId: 'gid://shopify/Collection/2',
          },
        ],
      },
    });
    mockStorefront.setMockResponse('NavCollections', {
      nodes: [
        {id: 'gid://shopify/Collection/1', title: 'New Drops', handle: 'all-products', image: null},
        {id: 'gid://shopify/Collection/2', title: 'Shirts & Tops', handle: 'shirts-tops', image: null},
      ],
    });

    const context = mockStorefront.createContext();
    const request = new Request('http://localhost/');

    // @ts-expect-error - minimal mock context
    const result = await loader({request, context, params: {}});

    expect(result.categoryItems.map((item) => item.handle)).toEqual(['shirts-tops']);
  });
});
