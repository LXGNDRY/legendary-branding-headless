// @vitest-environment jsdom
import {cleanup, fireEvent, render, screen, within} from '@testing-library/react';
import {createRoutesStub} from 'react-router';
import {afterEach, describe, expect, it, vi} from 'vitest';
import AddressesPage from '~/routes/account.addresses';
import OrdersPage from '~/routes/account.orders';
import {ErrorBoundary} from '~/routes/account';
import {LocaleProvider} from '~/lib/i18n';

vi.mock('~/lib/monitoring', () => ({captureError: vi.fn()}));

const address = (over: Record<string, unknown> = {}) => ({
  id: 'gid://shopify/CustomerAddress/1', firstName: 'Ada', lastName: 'L', address1: '1 Main', city: 'Berlin', zip: '10115',
  territoryCode: 'DE', zoneCode: null, country: 'Germany', province: null, ...over,
});

function renderAddresses(data: Record<string, unknown>) {
  const Stub = createRoutesStub([
    {path: '/account/addresses', Component: AddressesPage as never, loader: () => data},
  ]);
  return render(
    <LocaleProvider language="EN">
      <Stub initialEntries={['/account/addresses']} />
    </LocaleProvider>,
  );
}

afterEach(cleanup);

describe('AddressesPage', () => {
  it('shows a retry state instead of an empty list when the load failed', async () => {
    renderAddresses({failed: true, defaultAddress: null, addresses: [], nextCursor: null, isFirstPage: true});
    expect((await screen.findByRole('alert')).textContent).toMatch(/couldn.t load addresses/i);
    expect(screen.queryByText(/no addresses/i)).toBeNull();
  });

  it('shows a saved address in a country outside the usual list with its own country selected, not US', async () => {
    renderAddresses({
      failed: false, defaultAddress: null, nextCursor: null, isFirstPage: true,
      addresses: [address({territoryCode: 'ZA', country: 'South Africa'})],
    });
    fireEvent.click(await screen.findByText('Edit'));
    const country = (await screen.findByLabelText('Country')) as HTMLSelectElement;
    expect(country.value).toBe('ZA');
    expect(within(country).getByRole('option', {name: 'South Africa'})).toBeTruthy();
  });

  it('offers a required state list for the US and a short optional region code elsewhere', async () => {
    renderAddresses({failed: false, defaultAddress: null, addresses: [address()], nextCursor: null, isFirstPage: true});
    fireEvent.click(await screen.findByText('Edit'));
    const country = (await screen.findByLabelText('Country')) as HTMLSelectElement;
    expect(country.value).toBe('DE');
    expect((await screen.findByLabelText(/region code/i)).tagName).toBe('INPUT');

    fireEvent.change(country, {target: {value: 'US'}});
    const state = (await screen.findByLabelText('State / Province')) as HTMLSelectElement;
    expect(state.tagName).toBe('SELECT');
    expect(state.required).toBe(true);
    expect(within(state).getByRole('option', {name: 'Illinois'})).toBeTruthy();
    expect(within(state).getAllByRole('option').length).toBeGreaterThan(50);
  });

  it('links to the next page and back to the first', async () => {
    renderAddresses({failed: false, defaultAddress: null, addresses: [address()], nextCursor: 'abc123', isFirstPage: false});
    const next = await screen.findByRole('link', {name: /more addresses/i});
    expect(next.getAttribute('href')).toBe('/account/addresses?after=abc123');
    expect(screen.getByRole('link', {name: /first addresses/i}).getAttribute('href')).toBe('/account/addresses');
  });
});

describe('OrdersPage', () => {
  it('shows a retry state when the load failed and paginates when there are more orders', async () => {
    const Failed = createRoutesStub([
      {path: '/account/orders', Component: OrdersPage as never, loader: () => ({failed: true, orders: [], nextCursor: null, isFirstPage: true})},
    ]);
    render(
      <LocaleProvider language="EN">
        <Failed initialEntries={['/account/orders']} />
      </LocaleProvider>,
    );
    expect((await screen.findByRole('alert')).textContent).toMatch(/couldn.t load orders/i);
    cleanup();

    const More = createRoutesStub([
      {path: '/account/orders', Component: OrdersPage as never, loader: () => ({failed: false, orders: [], nextCursor: 'cur9', isFirstPage: true})},
    ]);
    render(
      <LocaleProvider language="EN">
        <More initialEntries={['/account/orders']} />
      </LocaleProvider>,
    );
    expect((await screen.findByRole('link', {name: /older orders/i})).getAttribute('href')).toBe('/account/orders?after=cur9');
  });
});

describe('account ErrorBoundary', () => {
  it('explains an unavailable account service without leaking details', async () => {
    const Stub = createRoutesStub([
      {
        path: '/account',
        Component: () => null,
        loader: () => {
          throw new Response('Customer accounts are unavailable', {status: 503});
        },
        ErrorBoundary: ErrorBoundary as never,
      },
    ]);
    render(<Stub initialEntries={['/account']} />);
    const alert = await screen.findByRole('alert');
    expect(alert.textContent).toMatch(/temporarily unavailable/i);
    expect(alert.textContent).not.toMatch(/Customer accounts are unavailable/);
  });

  it('uses generic copy for any other failure', async () => {
    const Stub = createRoutesStub([
      {
        path: '/account',
        Component: () => null,
        loader: () => {
          throw new Error('secret stack detail');
        },
        ErrorBoundary: ErrorBoundary as never,
      },
    ]);
    vi.spyOn(console, 'error').mockImplementation(() => {});
    render(<Stub initialEntries={['/account']} />);
    const alert = await screen.findByRole('alert');
    expect(alert.textContent).toMatch(/couldn.t load your account/i);
    expect(alert.textContent).not.toMatch(/secret stack detail/);
  });
});
