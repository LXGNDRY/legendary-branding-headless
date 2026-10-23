// @vitest-environment jsdom
import {cleanup, fireEvent, render, screen} from '@testing-library/react';
import {createRoutesStub} from 'react-router';
import '@testing-library/jest-dom/vitest';
import {afterEach, describe, expect, it, vi} from 'vitest';
import ProductPage, {ErrorBoundary} from '~/routes/products.$handle';

// NOTE: Hydrogen's cart/variant primitives bind to their own react-router copy and provider, which don't exist under vitest.
vi.mock('@shopify/hydrogen', async (importOriginal) => {
  const original = await importOriginal<typeof import('@shopify/hydrogen')>();
  const CartForm = Object.assign(
    ({children, inputs}: {children: React.ReactNode; inputs: {lines: Array<{merchandiseId: string; quantity: number}>}}) => (
      <form data-testid="cart-form" data-merchandise={inputs.lines[0].merchandiseId} data-quantity={inputs.lines[0].quantity}>
        {children}
      </form>
    ),
    {ACTIONS: original.CartForm.ACTIONS},
  );
  return {
    ...original,
    CartForm,
    Money: ({data}: {data: {amount: string}}) => <span>{`$${data.amount}`}</span>,
    Image: ({data}: {data: {url: string}}) => <img src={data.url} alt="" />,
    Analytics: {ProductView: () => null},
    useOptimisticVariant: (variant: unknown) => variant,
    VariantSelector: ({
      options,
      children,
    }: {
      options: Array<{name: string; optionValues: Array<{name: string}>}>;
      children: (arg: {option: unknown}) => React.ReactNode;
    }) => (
      <>
        {options.map((o) => (
          <div key={o.name}>
            {children({
              option: {
                name: o.name,
                values: o.optionValues.map((v) => ({value: v.name, isAvailable: true, isActive: false, to: `?${o.name}=${v.name}`})),
              },
            })}
          </div>
        ))}
      </>
    ),
  };
});
vi.mock('~/components/ui/ProductGallery', () => ({default: () => <div data-testid="gallery" />}));
vi.mock('~/components/ui/RecentlyViewed', () => ({default: () => null}));
vi.mock('~/components/ui/SizeGuideModal', () => ({
  default: ({open}: {open: boolean}) => <div data-testid="size-guide" data-open={String(open)} />,
}));
vi.mock('~/components/ui/WaitlistForm', () => ({default: () => <div data-testid="waitlist" />}));
vi.mock('~/components/ui/ProductCard', () => ({
  PRODUCT_CARD_FRAGMENT: '',
  default: ({product}: {product: {title: string}}) => <div data-testid="related-card">{product.title}</div>,
}));
vi.mock('~/components/sections/ProductReviewList', () => ({default: () => null}));
vi.mock('~/lib/monitoring', () => ({captureError: vi.fn()}));

const money = (amount: string) => ({amount, currencyCode: 'USD'});
const variant = (id: string, over: Record<string, unknown> = {}) => ({
  id,
  sku: id,
  availableForSale: true,
  quantityAvailable: 20,
  selectedOptions: [{name: 'Size', value: 'M'}],
  price: money('65.0'),
  compareAtPrice: null,
  image: null,
  ...over,
});

function data(over: Record<string, unknown> = {}, selected: unknown = variant('gid://shopify/ProductVariant/1')) {
  return {
    product: {
      id: 'gid://shopify/Product/1',
      title: 'Heavyweight Hoodie',
      handle: 'heavyweight-hoodie',
      descriptionHtml: '<p>Soft.</p>',
      tags: [] as string[],
      vendor: 'Legendary',
      productType: 'Hoodie',
      metafields: [],
      images: {nodes: []},
      options: [{id: 'o1', name: 'Size', optionValues: [{name: 'M', swatch: null}]}],
      selectedVariant: selected,
      variants: {nodes: [selected ?? variant('gid://shopify/ProductVariant/1')]},
      ...over,
    },
    relatedProducts: {
      products: {
        nodes: [
          {id: 'gid://shopify/Product/1', title: 'Heavyweight Hoodie'},
          {id: 'gid://shopify/Product/9', title: 'Other Tee'},
        ],
      },
    },
    reviews: {reviews: [], truncated: false},
    reviewSummary: null,
  };
}

function renderPage(loaderData: unknown) {
  const Stub = createRoutesStub([{id: 'root', path: '/', children: [{path: 'products/:handle', loader: () => loaderData, Component: ProductPage}]}]);
  return render(<Stub initialEntries={['/products/heavyweight-hoodie']} />);
}

afterEach(cleanup);

describe('ProductPage', () => {
  it('shows title, price and an enabled add-to-bag form for the selected in-stock variant', async () => {
    renderPage(data());
    expect(await screen.findByRole('heading', {level: 1, name: 'Heavyweight Hoodie'})).toBeInTheDocument();
    expect(screen.getAllByText('$65.0').length).toBeGreaterThan(0);
    const forms = screen.getAllByTestId('cart-form');
    expect(forms[0]).toHaveAttribute('data-merchandise', 'gid://shopify/ProductVariant/1');
    expect(forms[0]).toHaveAttribute('data-quantity', '1');
    expect(screen.getAllByTestId('add-to-cart').length).toBeGreaterThan(0);
  });

  it('never allows purchase without a chosen variant (no default-variant buying)', async () => {
    renderPage(data({}, null));
    await screen.findByRole('heading', {level: 1});
    expect(screen.queryByTestId('cart-form')).toBeNull();
    expect(screen.queryByTestId('add-to-cart')).toBeNull();
  });

  it('disables purchase and offers the waitlist when the selected variant is sold out', async () => {
    renderPage(data({}, variant('gid://shopify/ProductVariant/2', {availableForSale: false, quantityAvailable: 0})));
    await screen.findByRole('heading', {level: 1});
    expect(screen.queryByTestId('cart-form')).toBeNull();
    expect(screen.getAllByText('Sold Out').length).toBeGreaterThan(0);
    expect(screen.getByTestId('waitlist')).toBeInTheDocument();
  });

  it('shows a sale badge with the percent off computed from the same variant', async () => {
    renderPage(data({}, variant('gid://shopify/ProductVariant/3', {price: money('60.0'), compareAtPrice: money('80.0')})));
    expect(await screen.findAllByText('-25%')).not.toHaveLength(0);
    expect(screen.getAllByText('$80.0').length).toBeGreaterThan(0);
  });

  it('shows a coarse low-stock signal, not an exact count', async () => {
    renderPage(data({}, variant('gid://shopify/ProductVariant/4', {quantityAvailable: 3})));
    expect(await screen.findAllByText(/Low stock/i)).not.toHaveLength(0);
    expect(screen.queryByText(/only 3/i)).toBeNull();
  });

  it('renders Product and Breadcrumb JSON-LD', async () => {
    renderPage(data());
    await screen.findByRole('heading', {level: 1});
    const blocks = Array.from(document.querySelectorAll('script[type="application/ld+json"]')).map((s) => s.textContent ?? '');
    expect(blocks.some((b) => b.includes('"Product"'))).toBe(true);
    expect(blocks.some((b) => b.includes('BreadcrumbList'))).toBe(true);
  });

  it('lists related products but never the current one', async () => {
    renderPage(data());
    await screen.findByRole('heading', {level: 1});
    expect(screen.getAllByTestId('related-card').map((c) => c.textContent)).toEqual(['Other Tee']);
  });

  it('opens the size guide', async () => {
    renderPage(data());
    await screen.findByRole('heading', {level: 1});
    expect(screen.getByTestId('size-guide')).toHaveAttribute('data-open', 'false');
    fireEvent.click(screen.getByRole('button', {name: 'Size Guide'}));
    fireEvent.click(screen.getByRole('button', {name: /view full size guide/i}));
    expect(screen.getByTestId('size-guide')).toHaveAttribute('data-open', 'true');
  });
});

describe('ProductPage ErrorBoundary', () => {
  function renderError(error: unknown) {
    const Stub = createRoutesStub([{path: '/products/:handle', Component: () => null, ErrorBoundary, loader: () => { throw error; }}]);
    return render(<Stub initialEntries={['/products/x']} />);
  }

  it('shows the not-found copy for a 404', async () => {
    renderError(new Response('nope', {status: 404}));
    expect(await screen.findByRole('heading', {level: 1})).toBeInTheDocument();
    expect(screen.queryByText('Oops.')).toBeNull();
  });

  it('shows a generic failure (no internals) for any other error', async () => {
    renderError(new Error('secret stack detail'));
    expect(await screen.findByText('Oops.')).toBeInTheDocument();
    expect(screen.queryByText(/secret stack detail/)).toBeNull();
  });
});
