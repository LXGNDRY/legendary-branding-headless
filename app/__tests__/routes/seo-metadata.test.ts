import {describe, expect, it} from 'vitest';
import {createMockStorefront} from '~/test/mock-storefront';
import {meta as productMeta} from '~/routes/products.$handle';
import {meta as collectionMeta, loader as collectionLoader} from '~/routes/collections.$handle';

type Meta = (args: never) => Array<Record<string, unknown>>;
const productEntries = (seo: unknown) => (productMeta as Meta)({data: {product: {handle: 'tee', title: 'Tee', descriptionHtml: '<p>Real description</p>', seo, images: {nodes: []}}}, location: {pathname: '/products/tee', search: '?Color=Black'}} as never);
const collectionEntries = (search: string, extra = {}) => (collectionMeta as Meta)({data: {collection: {handle: 'all-products', title: 'Catalog', description: 'Collection description', seo: {title: 'Merchant title', description: 'Merchant description'}}, sort: 'featured', activeFilters: null, canonicalSearch: search.includes('cursor=opaque') ? '?cursor=opaque&direction=next' : '', ...extra}, location: {search}} as never);

describe('merchant SEO and pagination identity', () => {
  it('uses merchant product metadata and keeps variant selectors out of its canonical', () => {
    const entries = productEntries({title: 'Custom title', description: 'Custom description'});
    expect(entries.find((m) => 'title' in m)?.title).toBe('Custom title');
    expect(entries.find((m) => m.name === 'description')?.content).toBe('Custom description');
    expect(entries.find((m) => m.rel === 'canonical')?.href).toBe('https://legendary-branding.com/products/tee');
  });
  it('falls back to actual product content for blank merchant metadata', () => {
    const entries = productEntries({title: ' ', description: ''});
    expect(entries.find((m) => 'title' in m)?.title).toBe('Tee | LEGENDARY BRANDING');
    expect(entries.find((m) => m.name === 'description')?.content).toBe('Real description');
  });
  it('uses collection overrides and preserves pagination while removing tracking', () => {
    const entries = collectionEntries('?utm_source=google&cursor=opaque&direction=next');
    expect(entries.find((m) => 'title' in m)?.title).toBe('Merchant title');
    expect(entries.find((m) => m.name === 'description')?.content).toBe('Merchant description');
    expect(entries.find((m) => m.rel === 'canonical')?.href).toBe('https://legendary-branding.com/collections/all-products?cursor=opaque&direction=next');
  });
  it('does not publish filtered pagination as an unfiltered canonical page', () => {
    const entries = collectionEntries('?tag=hoodie&cursor=opaque', {activeFilters: [{tag: 'hoodie'}]});
    expect(entries.find((m) => m.rel === 'canonical')?.href).toBe('https://legendary-branding.com/collections/all-products');
    expect(entries.find((m) => m.name === 'robots')?.content).toBe('noindex, follow');
  });
});


describe('collection window canonical traversal', () => {
  const run = async (firstPage: boolean) => {
    const mock = createMockStorefront({responses: {Collection: (variables: Record<string, unknown>) => ({collection: {
      handle: 'all-products', title: 'Catalog', description: '',
      products: {nodes: [], filters: [], pageInfo: {
        hasPreviousPage: !firstPage, hasNextPage: true,
        startCursor: 'current-start', endCursor: variables.last === 1 ? 'previous-page-end' : 'current-end',
      }},
    }})}});
    const data = await collectionLoader({request: new Request('https://legendary-branding.com/collections/all-products?cursor=next-start&direction=previous'), params: {handle: 'all-products'}, context: mock.createContext()} as never);
    return {data, calls: mock.getCalls()};
  };
  it('collapses backwards navigation to the first page onto its base URL', async () => {
    const {data, calls} = await run(true);
    expect(data.canonicalSearch).toBe('');
    expect(calls).toHaveLength(1);
  });
  it('uses the same forward boundary for an intermediate window reached backwards', async () => {
    const {data, calls} = await run(false);
    expect(data.canonicalSearch).toBe('?cursor=previous-page-end&direction=next');
    expect(calls[1].variables).toMatchObject({last: 1, startCursor: 'current-start'});
  });
});
