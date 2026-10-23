import {describe, expect, it} from 'vitest';
import {loader} from '~/routes/api.quick-add';
import {createMockStorefront} from '~/test/mock-storefront';

let requestNumber = 0;

function makeRequest(handle?: string) {
  requestNumber += 1;
  const url = new URL('http://localhost/api/quick-add');
  if (handle !== undefined) url.searchParams.set('handle', handle);
  return new Request(url.toString(), {
    headers: {'X-Forwarded-For': `198.51.100.${requestNumber}`},
  });
}

describe('api.quick-add loader', () => {
  it('requires a product handle', async () => {
    const mock = createMockStorefront();
    const response = await loader({
      request: makeRequest(),
      context: mock.createContext(),
      params: {},
    } as never);

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({product: null});
    expect(mock.getCalls()).toHaveLength(0);
  });

  it('returns product options and variants for the active market', async () => {
    const product = {
      id: 'gid://shopify/Product/123',
      title: 'Heavyweight Hoodie',
      handle: 'heavyweight-hoodie',
      variants: {
        pageInfo: {hasNextPage: false, endCursor: null},
        nodes: [{id: 'gid://shopify/ProductVariant/456', availableForSale: true}],
      },
    };
    const mock = createMockStorefront({
      responses: {QuickAddProduct: {product}},
    });
    const context = mock.createContext();
    // @ts-expect-error - minimal Hydrogen app context
    const response = await loader({request: makeRequest('heavyweight-hoodie'), context, params: {}});

    expect(response.status).toBe(200);
    expect(response.headers.get('Cache-Control')).toBe('private, max-age=60');
    expect(await response.json()).toEqual({product: {...product, variants: {nodes: product.variants.nodes}}});
    expect(mock.getCalls()[0]).toMatchObject({
      operationName: 'QuickAddProduct',
      variables: {
        handle: 'heavyweight-hoodie',
        country: 'US',
        language: 'EN',
      },
    });
  });

  it('follows variant pagination so products with more than 100 variants keep every option', async () => {
    const page = (ids: string[], hasNextPage: boolean) => ({
      product: {
        id: 'gid://shopify/Product/9',
        title: 'Big Product',
        handle: 'big-product',
        variants: {
          pageInfo: {hasNextPage, endCursor: hasNextPage ? 'cursor-1' : null},
          nodes: ids.map((id) => ({id, availableForSale: true})),
        },
      },
    });
    const mock = createMockStorefront({
      responses: {
        QuickAddProduct: (variables: Record<string, unknown>) =>
          variables.after ? page(['v3', 'v4'], false) : page(['v1', 'v2'], true),
      },
    });
    // @ts-expect-error - minimal Hydrogen app context
    const response = await loader({request: makeRequest('big-product'), context: mock.createContext(), params: {}});

    const body = (await response.json()) as {product: {variants: {nodes: Array<{id: string}>}}};
    expect(body.product.variants.nodes.map((v) => v.id)).toEqual(['v1', 'v2', 'v3', 'v4']);
    expect(mock.getCalls()).toHaveLength(2);
  });

  it('returns 404 when the handle is not in the storefront', async () => {
    const mock = createMockStorefront({allowUnknown: true});
    // @ts-expect-error - minimal Hydrogen app context
    const response = await loader({
      request: makeRequest('missing-product'),
      context: mock.createContext(),
      params: {},
    });

    expect(response.status).toBe(404);
    expect(await response.json()).toEqual({product: null});
  });

  it('returns a clean 500 response when the Storefront API fails', async () => {
    const mock = createMockStorefront();
    // @ts-expect-error - minimal Hydrogen app context
    const response = await loader({
      request: makeRequest('heavyweight-hoodie'),
      context: mock.createContext(),
      params: {},
    });

    expect(response.status).toBe(500);
    expect(await response.json()).toEqual({product: null});
  });
});
