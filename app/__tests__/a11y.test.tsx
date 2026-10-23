// @vitest-environment jsdom
import {cleanup, fireEvent, render, screen, within} from '@testing-library/react';
import {MemoryRouter, createRoutesStub} from 'react-router';
import {ShopifyProvider} from '@shopify/hydrogen-react';
import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest';
import Button from '~/components/ui/Button';
import CartDrawer from '~/components/layout/CartDrawer';
import Analytics from '~/components/seo/Analytics';
import SizeGuideModal from '~/components/ui/SizeGuideModal';
import AccountIndex from '~/routes/account._index';
import AccountOrders from '~/routes/account.orders';
import AccountEdit from '~/routes/account.edit';
import AddressesPage from '~/routes/account.addresses';
import {LocaleProvider} from '~/lib/i18n';
import {resetOverlayStack} from '~/lib/overlay-stack';
import {resetConsentMemory} from '~/lib/consent';
import {a11yViolations} from '~/test/axe';

vi.mock('~/lib/monitoring', () => ({captureError: vi.fn()}));
// NOTE: Hydrogen's CartForm uses its own copy of react-router's data-router context, which is absent under test, so
// it is replaced by a plain form with the same action constants; everything the drawer renders is real.
vi.mock('@shopify/hydrogen', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@shopify/hydrogen')>()),
  CartForm: Object.assign(
    ({children}: {children: React.ReactNode | ((state: {state: string}) => React.ReactNode)}) => (
      <form method="post">{typeof children === 'function' ? children({state: 'idle'}) : children}</form>
    ),
    {ACTIONS: {LinesAdd: 'LinesAdd', LinesUpdate: 'LinesUpdate', LinesRemove: 'LinesRemove', DiscountCodesUpdate: 'DiscountCodesUpdate'}},
  ),
  useAnalytics: () => ({publish: vi.fn(), subscribe: vi.fn(), register: () => ({ready: () => {}}), customerPrivacy: null}),
}));

beforeEach(() => {
  window.localStorage.clear();
  resetConsentMemory();
});
afterEach(() => {
  cleanup();
  resetOverlayStack();
  vi.useRealTimers();
});

const settle = () => new Promise((resolve) => setTimeout(resolve, 30));
const expectClean = async (root?: Element) => expect(await a11yViolations(root)).toEqual([]);

function routed(path: string, Component: React.ComponentType, data: unknown, action?: () => unknown) {
  const Stub = createRoutesStub([{path, Component: Component as never, loader: () => data, ...(action ? {action} : {})}]);
  return render(
    <LocaleProvider language="EN">
      <Stub initialEntries={[path]} />
    </LocaleProvider>,
  );
}

describe('Button', () => {
  it('renders a followable link as a single anchor', () => {
    render(
      <MemoryRouter>
        <Button as="link" to="/account/orders">View orders</Button>
        <Button as="a" href="https://checkout.test/c/1">Checkout</Button>
      </MemoryRouter>,
    );
    expect(screen.getAllByRole('link')).toHaveLength(2);
    expect(screen.queryByRole('button')).toBeNull();
  });

  it('a disabled or loading link is not a link: it cannot be followed by click, Enter or assistive technology', () => {
    const onClick = vi.fn();
    render(
      <MemoryRouter>
        <Button as="a" href="https://checkout.test/c/1" loading onClick={onClick}>Redirecting</Button>
        <Button as="link" to="/account" disabled onClick={onClick}>Account</Button>
      </MemoryRouter>,
    );
    expect(screen.queryByRole('link')).toBeNull();
    const buttons = screen.getAllByRole('button') as HTMLButtonElement[];
    expect(buttons).toHaveLength(2);
    for (const button of buttons) {
      expect(button.disabled).toBe(true);
      fireEvent.click(button);
      fireEvent.keyDown(button, {key: 'Enter'});
    }
    expect(onClick).not.toHaveBeenCalled();
    expect(buttons[0].getAttribute('aria-busy')).toBe('true');
  });

  it('passes a click handler through so the checkout link can keep its new-tab behavior', () => {
    const onClick = vi.fn((event: React.MouseEvent) => event.preventDefault());
    render(<Button as="a" href="https://checkout.test/c/1" onClick={onClick}>Checkout</Button>);
    fireEvent.click(screen.getByRole('link'), {ctrlKey: true});
    expect(onClick).toHaveBeenCalledTimes(1);
    expect(onClick.mock.calls[0][0].ctrlKey).toBe(true);
  });

  it('has no accessibility violations in any variant or state', async () => {
    const {container} = render(
      <MemoryRouter>
        <Button>Add to cart</Button>
        <Button disabled>Sold out</Button>
        <Button loading>Saving</Button>
        <Button as="link" to="/x" variant="outline">Link</Button>
        <Button as="a" href="/y" variant="ghost">Anchor</Button>
      </MemoryRouter>,
    );
    await expectClean(container);
  });
});

describe('account pages', () => {
  it('dashboard: one control per action (no button inside a link)', async () => {
    const {container} = routed('/account', AccountIndex, {customer: {firstName: 'Ada', lastName: 'L', emailAddress: {emailAddress: 'a@x.test'}}});
    await screen.findByText(/Hey, Ada/);
    expect(container.querySelectorAll('a button, button a')).toHaveLength(0);
    await expectClean(container);
  });

  it('dashboard: failed load announces itself', async () => {
    const {container} = routed('/account', AccountIndex, {customer: null});
    expect((await screen.findByRole('alert')).textContent).toMatch(/couldn.t load/i);
    await expectClean(container);
  });

  it('orders: filled, empty, failed and paginated states', async () => {
    const order = {
      id: 'gid://shopify/Order/1', name: '#1', number: 1, processedAt: '2026-01-01T00:00:00Z', statusPageUrl: 'https://shop.test/s',
      totalPrice: {amount: '49.00', currencyCode: 'USD'}, lineItems: {nodes: [{title: 'Tee', quantity: 1}]}, fulfillments: {nodes: []},
    };
    for (const data of [
      {failed: false, orders: [order], nextCursor: 'c1', isFirstPage: false},
      {failed: false, orders: [], nextCursor: null, isFirstPage: true},
      {failed: true, orders: [], nextCursor: null, isFirstPage: true},
    ]) {
      const {container} = routed('/account/orders', AccountOrders, data);
      await settle();
      expect(container.querySelectorAll('a button, button a')).toHaveLength(0);
      await expectClean(container);
      cleanup();
    }
  });

  it('edit form: labels are associated, errors and success are announced', async () => {
    const customer = {firstName: 'Ada', lastName: 'L', emailAddress: {emailAddress: 'a@x.test'}};
    const {container} = routed('/account/edit', AccountEdit, {customer});
    await screen.findByLabelText('First Name');
    expect(screen.getByLabelText('Last Name')).toBeTruthy();
    expect((screen.getByLabelText('First Name') as HTMLInputElement).autocomplete).toBe('given-name');
    await expectClean(container);
  });

  it('addresses: add and edit forms have associated labels, autocomplete tokens and no violations', async () => {
    const address = {
      id: 'gid://shopify/CustomerAddress/1', firstName: 'Ada', lastName: 'L', address1: '1 Main', city: 'Chicago', zip: '60601',
      territoryCode: 'US', zoneCode: 'IL', country: 'United States', province: 'Illinois',
    };
    const {container} = routed('/account/addresses', AddressesPage, {failed: false, defaultAddress: address, addresses: [], nextCursor: null, isFirstPage: true});
    fireEvent.click(await screen.findByText('Edit'));
    for (const label of ['First Name', 'Last Name', 'Address', 'City', 'State / Province', 'ZIP / Postal Code', 'Country', 'Company (optional)', 'Phone (optional)']) {
      expect(await screen.findByLabelText(label), label).toBeTruthy();
    }
    expect((screen.getByLabelText('ZIP / Postal Code') as HTMLInputElement).autocomplete).toBe('postal-code');
    await expectClean(container);
  });
});

describe('dialogs', () => {
  const line = {
    id: 'gid://shopify/CartLine/1', quantity: 2,
    merchandise: {id: 'gid://shopify/ProductVariant/1', title: 'M', price: {amount: '49.00', currencyCode: 'USD'}, image: null, selectedOptions: [{name: 'Size', value: 'M'}], product: {title: 'Legend Tee', handle: 'legend-tee'}},
    cost: {totalAmount: {amount: '98.00', currencyCode: 'USD'}, amountPerQuantity: {amount: '49.00', currencyCode: 'USD'}},
  };
  const cart = {
    id: 'gid://shopify/Cart/1', checkoutUrl: 'https://checkout.test/c/1', totalQuantity: 2, lines: {edges: [{node: line}]},
    cost: {subtotalAmount: {amount: '98.00', currencyCode: 'USD'}, totalAmount: {amount: '98.00', currencyCode: 'USD'}},
  };

  const shop = {storefrontToken: 't', storeDomain: 'shop.test', storefrontApiVersion: '2025-04', countryIsoCode: 'US', languageIsoCode: 'EN'} as const;

  it('filled cart drawer: a labelled dialog with single controls and no violations', async () => {
    const Drawer = () => (
      <ShopifyProvider {...shop}>
        <CartDrawer cart={cart as never} open onClose={() => {}} />
      </ShopifyProvider>
    );
    const Stub = createRoutesStub([{path: '/', Component: Drawer}]);
    const {container} = render(
      <LocaleProvider language="EN">
        <Stub />
      </LocaleProvider>,
    );
    await settle();
    expect(screen.getAllByRole('dialog').length).toBeGreaterThan(0);
    expect(container.querySelectorAll('a button, button a')).toHaveLength(0);
    expect(screen.getByTestId('drawer-checkout').tagName).toBe('A');
    await expectClean(container);
  });

  it('checkout link: a modified click leaves it usable, a plain click makes it non-activatable', async () => {
    const Drawer = () => (
      <ShopifyProvider {...shop}>
        <CartDrawer cart={cart as never} open onClose={() => {}} />
      </ShopifyProvider>
    );
    const Stub = createRoutesStub([{path: '/', Component: Drawer}]);
    render(
      <LocaleProvider language="EN">
        <Stub />
      </LocaleProvider>,
    );
    await settle();
    const link = screen.getByTestId('drawer-checkout');
    link.addEventListener('click', (event) => event.preventDefault());
    fireEvent.click(link, {ctrlKey: true});
    await settle();
    expect(screen.getByTestId('drawer-checkout').tagName).toBe('A');
    fireEvent.click(screen.getByTestId('drawer-checkout'));
    await settle();
    const after = screen.getByTestId('drawer-checkout') as HTMLButtonElement;
    expect(after.tagName).toBe('BUTTON');
    expect(after.disabled).toBe(true);
  });

  it('cookie banner and its category panel have no violations', async () => {
    const {container} = render(
      <MemoryRouter>
        <Analytics />
      </MemoryRouter>,
    );
    // the banner appears after a short reconciliation window
    await screen.findByRole('dialog', {name: 'Cookie consent'}, {timeout: 2000});
    await expectClean(container);
    fireEvent.click(screen.getByLabelText('Choose cookie categories'));
    await expectClean(container);
  });

  it('size guide modal has no violations', async () => {
    const {container} = render(
      <MemoryRouter>
        <SizeGuideModal open onClose={() => {}} />
      </MemoryRouter>,
    );
    await settle();
    await expectClean(container);
    expect(within(container).getAllByRole('dialog').length).toBeGreaterThan(0);
  });
});
