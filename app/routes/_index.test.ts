/**
 * Homepage route loader tests.
 *
 * Tests the loader function directly with a mocked storefront.
 * Would have caught the unused-variable GraphQL bug and similar
 * query-shape regressions.
 */

import {describe, it, expect, beforeEach} from 'vitest';
import {loader} from './_index';
import {createMockStorefront} from '~/test/mock-storefront';

describe('_index loader', () => {
  let mockStorefront: ReturnType<typeof createMockStorefront>;

  beforeEach(() => {
    mockStorefront = createMockStorefront({
      responses: {
        Homepage: {
          featuredCollections: {nodes: []},
          newDrops: {products: {nodes: []}},
          bestSellers: {products: {nodes: []}},
        },
      },
    });
  });

  it('runs without throwing on happy-path data', async () => {
    const context = mockStorefront.createContext();
    const request = new Request('http://localhost/');

    // @ts-expect-error - we're testing the loader with a minimal mock context
    const result = await loader({request, context, params: {}});

    expect(result).toBeDefined();
    expect(result.featuredCollections).toBeDefined();
    expect(result.newDrops).toBeDefined();
    expect(result.bestSellers).toBeDefined();
  });

  it('calls storefront.query with the Homepage operation', async () => {
    const context = mockStorefront.createContext();
    const request = new Request('http://localhost/');

    // @ts-expect-error - minimal mock context
    await loader({request, context, params: {}});

    const calls = mockStorefront.getCalls();
    expect(calls).toHaveLength(1);
    expect(calls[0].operationName).toBe('Homepage');
  });

  it('passes country and language variables from i18n', async () => {
    const context = mockStorefront.createContext();
    const request = new Request('http://localhost/');

    // @ts-expect-error - minimal mock context
    await loader({request, context, params: {}});

    const calls = mockStorefront.getCalls();
    expect(calls[0].variables.country).toBe('US');
    expect(calls[0].variables.language).toBe('EN');
  });

  it('returns featured collections from the query', async () => {
    const mockCollection = {
      id: 'gid://shopify/Collection/1',
      title: 'Test Collection',
      handle: 'test',
      description: '',
      image: null,
    };

    mockStorefront.setMockResponse('Homepage', {
      featuredCollections: {nodes: [mockCollection]},
      newDrops: {products: {nodes: []}},
      bestSellers: {products: {nodes: []}},
    });

    const context = mockStorefront.createContext();
    const request = new Request('http://localhost/');

    // @ts-expect-error - minimal mock context
    const result = await loader({request, context, params: {}});

    expect(result.featuredCollections.nodes).toHaveLength(1);
    expect(result.featuredCollections.nodes[0].handle).toBe('test');
  });
});
