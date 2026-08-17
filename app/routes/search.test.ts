/**
 * Search route loader tests.
 */

import {describe, it, expect, beforeEach} from 'vitest';
import {loader} from './search';
import {createMockStorefront} from '~/test/mock-storefront';

describe('search loader', () => {
  let mockStorefront: ReturnType<typeof createMockStorefront>;

  beforeEach(() => {
    mockStorefront = createMockStorefront({
      responses: {
        Search: {
          products: {nodes: [], totalCount: 0},
          collections: {nodes: [], totalCount: 0},
          pages: {nodes: [], totalCount: 0},
        },
      },
    });
  });

  it('runs without throwing with no query', async () => {
    const context = mockStorefront.createContext();
    const request = new Request('http://localhost/search');
    const params = {};

    // @ts-expect-error - minimal mock context
    const result = await loader({request, context, params});

    expect(result).toBeDefined();
  });

  it('reads q from search params', async () => {
    const context = mockStorefront.createContext();
    const request = new Request('http://localhost/search?q=hoodie');
    const params = {};

    // @ts-expect-error - minimal mock context
    const result = await loader({request, context, params});

    expect(result.query).toBe('hoodie');
  });

  it('returns null search when no query', async () => {
    const context = mockStorefront.createContext();
    const request = new Request('http://localhost/search');
    const params = {};

    // @ts-expect-error - minimal mock context
    const result = await loader({request, context, params});

    expect(result.query).toBe('');
    expect(result.search).toBeNull();
  });
});
