// @vitest-environment jsdom
import {cleanup, fireEvent, render, screen, waitFor, within} from '@testing-library/react';
import {createRoutesStub, useLocation} from 'react-router';
import '@testing-library/jest-dom/vitest';
import {afterEach, describe, expect, it, vi} from 'vitest';
import SearchPage from '~/routes/search';

vi.mock('~/components/ui/ProductCard', () => ({
  PRODUCT_CARD_FRAGMENT: '',
  default: ({product}: {product: {id: string; title: string}}) => <div data-testid="card">{product.title}</div>,
}));

const filters = [
  {id: 'productType', label: 'Product type', values: [{label: 'Hoodie', count: 4, input: JSON.stringify({productType: 'Hoodie'})}]},
  {id: 'productVendor', label: 'Brand', values: [{label: 'Legendary', count: 9, input: 'not-json'}]},
];

function results(over: Record<string, unknown> = {}) {
  return {
    query: 'hoodie',
    sortKey: 'RELEVANCE',
    reverse: false,
    search: {
      totalCount: 2,
      pageInfo: {hasNextPage: true, hasPreviousPage: false, startCursor: 's', endCursor: 'e'},
      productFilters: filters,
      products: [{node: {id: '1', title: 'Heavy Hoodie'}}, {node: {id: '2', title: 'Zip Hoodie'}}],
      ...over,
    },
  };
}

function LocationProbe() {
  const loc = useLocation();
  return <output data-testid="loc">{loc.pathname + loc.search}</output>;
}

function renderSearch(data: unknown, entry = '/search?q=hoodie') {
  const Stub = createRoutesStub([
    {
      path: '/search',
      loader: () => data,
      Component: () => (
        <>
          <SearchPage />
          <LocationProbe />
        </>
      ),
    },
  ]);
  return render(<Stub initialEntries={[entry]} />);
}

afterEach(cleanup);

describe('SearchPage', () => {
  it('shows the search form when there is no query', async () => {
    renderSearch({query: '', search: null, sortKey: 'RELEVANCE', reverse: false}, '/search');
    expect(await screen.findByRole('heading', {name: /find what you're looking for/i})).toBeInTheDocument();
    expect(screen.getByRole('searchbox')).toBeInTheDocument();
  });

  it('shows the empty state when nothing matches and no filter is active', async () => {
    renderSearch(results({totalCount: 0, products: [], productFilters: [], pageInfo: {hasNextPage: false, hasPreviousPage: false}}));
    expect(await screen.findByText('No products match your search.')).toBeInTheDocument();
    expect(screen.getByText('0 results found')).toBeInTheDocument();
  });

  it('renders singular/plural result counts and the product cards', async () => {
    renderSearch(results());
    expect(await screen.findByText('2 results found')).toBeInTheDocument();
    expect(screen.getAllByTestId('card').map((c) => c.textContent)).toEqual(['Heavy Hoodie', 'Zip Hoodie']);
    expect(screen.getByText('Showing 2 of 2')).toBeInTheDocument();
  });

  it('uses 1 result singular wording', async () => {
    renderSearch(results({totalCount: 1, products: [{node: {id: '1', title: 'Only One'}}]}));
    expect(await screen.findByText('1 result found')).toBeInTheDocument();
  });

  it('applies a facet using the API input value and clears it again', async () => {
    renderSearch(results());
    const desktop = (await screen.findAllByText('Product type'))[0].closest('div') as HTMLElement;
    fireEvent.click(within(desktop.parentElement as HTMLElement).getByRole('checkbox', {name: /Hoodie/}));
    await waitFor(() => expect(screen.getByTestId('loc').textContent).toContain('type=Hoodie'));
    expect(screen.getByRole('button', {name: /Hoodie/})).toBeInTheDocument();
    fireEvent.click(screen.getAllByRole('button', {name: 'Clear all'})[0]);
    await waitFor(() => expect(screen.getByTestId('loc').textContent).not.toContain('type='));
  });

  it('falls back to the raw facet input when it is not the expected JSON shape', async () => {
    renderSearch(results());
    const brand = (await screen.findAllByText('Brand'))[0].closest('div') as HTMLElement;
    fireEvent.click(within(brand.parentElement as HTMLElement).getByRole('checkbox', {name: /Legendary/}));
    await waitFor(() => expect(screen.getByTestId('loc').textContent).toContain('vendor=not-json'));
  });

  it('toggles in-stock filtering and resets pagination cursors', async () => {
    renderSearch(results(), '/search?q=hoodie&after=abc');
    fireEvent.click((await screen.findAllByLabelText('In stock only'))[0]);
    await waitFor(() => {
      const loc = screen.getByTestId('loc').textContent as string;
      expect(loc).toContain('in_stock=1');
      expect(loc).not.toContain('after=');
    });
  });

  it('keeps the filter UI when filters produce zero results', async () => {
    renderSearch(results({totalCount: 0, products: []}), '/search?q=hoodie&in_stock=1');
    expect(await screen.findByText('No products match your current filters.')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', {name: 'Clear filters'}));
    await waitFor(() => expect(screen.getByTestId('loc').textContent).not.toContain('in_stock'));
  });

  it('sorting navigates with sort and reverse and drops cursors', async () => {
    renderSearch(results(), '/search?q=hoodie&before=zzz');
    fireEvent.change(await screen.findByLabelText('Sort'), {target: {value: 'PRICE-true'}});
    await waitFor(() => {
      const loc = screen.getByTestId('loc').textContent as string;
      expect(loc).toContain('sort=PRICE');
      expect(loc).toContain('reverse=true');
      expect(loc).not.toContain('before=');
    });
  });

  it('links to the next page with the end cursor and shows a disabled previous', async () => {
    renderSearch(results());
    const next = await screen.findByRole('link', {name: /Next/});
    expect(next.getAttribute('href')).toContain('after=e');
    expect(screen.queryByRole('link', {name: /Previous/})).toBeNull();
  });

  it('links to the previous page with the start cursor', async () => {
    renderSearch(results({pageInfo: {hasNextPage: false, hasPreviousPage: true, startCursor: 's1', endCursor: 'e1'}}));
    const prev = await screen.findByRole('link', {name: /Previous/});
    expect(prev.getAttribute('href')).toContain('before=s1');
  });

  it('opens and closes the mobile filter drawer', async () => {
    renderSearch(results());
    fireEvent.click((await screen.findAllByRole('button', {name: /Filters/}))[0]);
    const dialog = await screen.findByRole('dialog', {name: 'Filters'});
    fireEvent.click(within(dialog).getAllByRole('button', {name: 'Close filters'})[1]);
    await waitFor(() => expect(screen.queryByRole('dialog', {name: 'Filters'})).toBeNull());
  });
});
