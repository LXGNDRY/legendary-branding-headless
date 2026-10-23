// @vitest-environment jsdom
import {cleanup, fireEvent, render, screen, waitFor, within} from '@testing-library/react';
import {createRoutesStub, useLocation} from 'react-router';
import '@testing-library/jest-dom/vitest';
import {afterEach, describe, expect, it, vi} from 'vitest';
import CollectionPage from '~/routes/collections.$handle';

// NOTE: Hydrogen's Pagination/Image bind to their own react-router copy and provider, which don't exist under vitest.
vi.mock('@shopify/hydrogen', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@shopify/hydrogen')>()),
  Image: ({data}: {data: {url: string; altText?: string | null}}) => <img src={data.url} alt={data.altText ?? ''} />,
  Pagination: ({
    connection,
    children,
  }: {
    connection: {nodes: unknown[]};
    children: (api: Record<string, unknown>) => React.ReactNode;
  }) =>
    children({
      nodes: connection.nodes,
      PreviousLink: ({children: c}: {children: React.ReactNode}) => <a href="#prev">{c}</a>,
      NextLink: ({children: c}: {children: React.ReactNode}) => <a href="#next">{c}</a>,
      isLoading: false,
    }),
}));

vi.mock('~/components/ui/ProductCard', () => ({
  PRODUCT_CARD_FRAGMENT: '',
  default: ({product}: {product: {title: string}}) => <div data-testid="card">{product.title}</div>,
}));

const baseCollection = {
  id: 'gid://shopify/Collection/1',
  title: 'Hoodies & Jackets',
  description: 'Heavyweight layers.',
  handle: 'hoodies-jackets',
  image: null,
  products: {
    nodes: [
      {id: 'p1', title: 'Heavy Hoodie', handle: 'heavy-hoodie', featuredImage: {url: 'https://cdn.example/a.jpg'}},
      {id: 'p2', title: 'Zip Jacket', handle: 'zip-jacket', featuredImage: null},
    ],
    pageInfo: {hasPreviousPage: false, hasNextPage: true, startCursor: 's', endCursor: 'e'},
    filters: [
      {
        id: 'filter.p.product_type',
        label: 'Product type',
        type: 'LIST',
        values: [{id: 'filter.p.product_type.Hoodie', label: 'Hoodie', count: 3, input: JSON.stringify({productType: 'Hoodie'})}],
      },
    ],
  },
};

function Probe() {
  const loc = useLocation();
  return <output data-testid="loc">{loc.pathname + loc.search}</output>;
}

function renderCollection(collection = baseCollection, sort = 'featured', entry = '/collections/hoodies-jackets') {
  const Stub = createRoutesStub([
    {
      path: '/collections/:handle',
      loader: () => ({collection, sort, activeFilters: null}),
      Component: () => (
        <>
          <CollectionPage />
          <Probe />
        </>
      ),
    },
  ]);
  return render(<Stub initialEntries={[entry]} />);
}

afterEach(cleanup);

describe('CollectionPage', () => {
  it('renders the title, product count and cards', async () => {
    renderCollection();
    expect(await screen.findByRole('heading', {level: 1, name: 'Hoodies & Jackets'})).toBeInTheDocument();
    expect(screen.getByText('2 products')).toBeInTheDocument();
    expect(screen.getAllByTestId('card')).toHaveLength(2);
  });

  it('uses singular wording for one product', async () => {
    renderCollection({...baseCollection, products: {...baseCollection.products, nodes: [baseCollection.products.nodes[0]]}});
    expect(await screen.findByText('1 product')).toBeInTheDocument();
  });

  it('shows the empty state and clears filters when no product matches', async () => {
    renderCollection({...baseCollection, products: {...baseCollection.products, nodes: []}}, 'featured', '/collections/hoodies-jackets?in_stock=1');
    expect(await screen.findByText('No products match your current filters.')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', {name: 'Clear filters'}));
    await waitFor(() => expect(screen.getByTestId('loc').textContent).not.toContain('in_stock'));
  });

  it('changes sort through the URL and drops pagination cursors', async () => {
    renderCollection(baseCollection, 'featured', '/collections/hoodies-jackets?cursor=abc&direction=next');
    fireEvent.change(await screen.findByLabelText('Sort products'), {target: {value: 'price-desc'}});
    await waitFor(() => {
      const loc = screen.getByTestId('loc').textContent as string;
      expect(loc).toContain('sort=price-desc');
      expect(loc).not.toContain('cursor=');
      expect(loc).not.toContain('direction=');
    });
  });

  it('removes the sort param when going back to Featured', async () => {
    renderCollection(baseCollection, 'price-desc', '/collections/hoodies-jackets?sort=price-desc');
    fireEvent.change(await screen.findByLabelText('Sort products'), {target: {value: 'featured'}});
    await waitFor(() => expect(screen.getByTestId('loc').textContent).not.toContain('sort='));
  });

  it('toggles a product-type facet using the API input value and clears all filters', async () => {
    renderCollection();
    const typeLabel = (await screen.findAllByText('Product type'))[0];
    fireEvent.click(within(typeLabel.closest('div')?.parentElement as HTMLElement).getByRole('checkbox', {name: /Hoodie/}));
    await waitFor(() => expect(screen.getByTestId('loc').textContent).toContain('type=Hoodie'));
    fireEvent.click(screen.getAllByRole('button', {name: 'Clear all'})[0]);
    await waitFor(() => expect(screen.getByTestId('loc').textContent).not.toContain('type='));
  });

  it('toggles the in-stock filter', async () => {
    renderCollection();
    fireEvent.click((await screen.findAllByLabelText('In stock only'))[0]);
    await waitFor(() => expect(screen.getByTestId('loc').textContent).toContain('in_stock=1'));
  });

  it('opens and closes the mobile filter drawer', async () => {
    renderCollection();
    fireEvent.click((await screen.findAllByRole('button', {name: /Filters/}))[0]);
    const dialog = await screen.findByRole('dialog', {name: 'Filters'});
    fireEvent.click(within(dialog).getAllByRole('button', {name: 'Close filters'})[1]);
    await waitFor(() => expect(screen.queryByRole('dialog', {name: 'Filters'})).toBeNull());
  });

  it('exposes JSON-LD for the collection and breadcrumb', async () => {
    renderCollection();
    await screen.findByRole('heading', {level: 1});
    const blocks = Array.from(document.querySelectorAll('script[type="application/ld+json"]')).map((s) => s.textContent ?? '');
    expect(blocks.some((b) => b.includes('CollectionPage'))).toBe(true);
    expect(blocks.some((b) => b.includes('BreadcrumbList'))).toBe(true);
  });
});
