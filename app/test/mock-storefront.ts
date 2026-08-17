/**
 * Mock storefront for loader/action tests.
 *
 * Returns a storefront.query mock that:
 * - Tracks all calls (query + variables) for assertion
 * - Returns a configurable mock response per query name
 * - Throws on unexpected queries (set `allowUnknown: true` to disable)
 *
 * Usage:
 *   const {mockStorefront, setMockResponse, getCalls} = createMockStorefront({
 *     products: {nodes: [{id: '1', title: 'Test'}]},
 *   });
 *   // ... run loader with mockStorefront as context.storefront ...
 *   expect(getCalls()).toHaveLength(1);
 */

import {CacheShort} from '~/lib/cache';

export interface MockStorefrontConfig {
  /** Mock responses keyed by query operation name */
  responses?: Record<string, unknown>;
  /** Allow unknown queries (return empty object) instead of throwing */
  allowUnknown?: boolean;
}

export interface StorefrontQueryCall {
  query: string;
  variables: Record<string, unknown>;
  operationName: string | null;
}

export function createMockStorefront(config: MockStorefrontConfig = {}) {
  const calls: StorefrontQueryCall[] = [];

  function extractOperationName(query: string): string | null {
    const match = query.match(/query\s+(\w+)/) || query.match(/mutation\s+(\w+)/);
    return match ? match[1] : null;
  }

  const storefront = {
    i18n: {
      country: 'US',
      language: 'EN',
    },
    query: async (
      query: string,
      options?: {variables?: Record<string, unknown>; cache?: unknown},
    ) => {
      const operationName = extractOperationName(query);
      calls.push({
        query,
        variables: options?.variables ?? {},
        operationName,
      });

      // Check for a mock response by operation name
      if (operationName && config.responses?.[operationName]) {
        return config.responses[operationName];
      }

      if (config.allowUnknown) {
        return {};
      }

      throw new Error(
        `Unmocked storefront query: ${operationName ?? '<anonymous>'}. ` +
          `Add it to responses config or set allowUnknown: true.`,
      );
    },
  };

  return {
    storefront,
    calls,
    getCalls: () => calls,
    setMockResponse: (name: string, data: unknown) => {
      if (!config.responses) config.responses = {};
      config.responses[name] = data;
    },
    // Helper to create a full app context shape
    createContext: (overrides: Record<string, unknown> = {}) => ({
      storefront,
      session: {
        get: () => null,
        set: () => {},
        unset: () => {},
        commit: async () => '',
        isPending: false,
      },
      waitUntil: () => {},
      ...overrides,
    }),
  };
}

// Common mock response builders
export const mockResponses = {
  collection: (overrides: Record<string, unknown> = {}) => ({
    collection: {
      id: 'gid://shopify/Collection/123',
      title: 'All Products',
      handle: 'all-products',
      description: '',
      image: null,
      products: {
        nodes: [],
        totalCount: 0,
        pageInfo: {
          hasPreviousPage: false,
          hasNextPage: false,
          startCursor: null,
          endCursor: null,
        },
        filters: [],
      },
      ...overrides,
    },
  }),
  homepage: (overrides: Record<string, unknown> = {}) => ({
    collections: {nodes: []},
    products: {nodes: []},
    shop: {name: 'Legendary Branding'},
    ...overrides,
  }),
  product: (overrides: Record<string, unknown> = {}) => ({
    product: {
      id: 'gid://shopify/Product/456',
      title: 'Test Product',
      handle: 'test-product',
      description: '',
      descriptionHtml: '',
      images: {nodes: []},
      variants: {nodes: []},
      ...overrides,
    },
  }),
  search: (overrides: Record<string, unknown> = {}) => ({
    products: {nodes: [], totalCount: 0},
    collections: {nodes: [], totalCount: 0},
    pages: {nodes: [], totalCount: 0},
    ...overrides,
  }),
};

export {CacheShort};
