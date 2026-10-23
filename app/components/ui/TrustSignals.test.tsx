// @vitest-environment jsdom
import {cleanup, render, screen} from '@testing-library/react';
import {createRoutesStub} from 'react-router';
import '@testing-library/jest-dom/vitest';
import {afterEach, describe, expect, it} from 'vitest';
import TrustSignals from './TrustSignals';
import {EMPTY_STORE_TRUST} from '~/lib/trust';

afterEach(cleanup);

function renderWith(storeTrust: object) {
  const Stub = createRoutesStub([{id: 'root', path: '/', loader: () => ({storeTrust}), Component: () => <TrustSignals />}]);
  return render(<Stub initialEntries={['/']} />);
}

describe('TrustSignals', () => {
  it('links to the policies using the titles Shopify publishes, plus payment methods', async () => {
    renderWith({...EMPTY_STORE_TRUST, shippingPolicyTitle: 'Shipping Policy', refundPolicyTitle: 'Refund Policy', paymentMethods: ['Visa', 'Apple Pay']});
    expect(await screen.findByRole('link', {name: 'Shipping Policy'})).toHaveAttribute('href', '/policies/shipping-policy');
    expect(screen.getByRole('link', {name: 'Refund Policy'})).toHaveAttribute('href', '/policies/refund-policy');
    expect(screen.getByText(/Visa · Apple Pay/)).toBeInTheDocument();
  });

  it('writes no shipping, duties or returns claim of its own', async () => {
    renderWith({...EMPTY_STORE_TRUST, returnDays: 30, shippingPolicyTitle: 'Shipping Policy', refundPolicyTitle: 'Refund Policy'});
    await screen.findByRole('link', {name: 'Shipping Policy'});
    expect(document.body.textContent).not.toMatch(/worldwide|30-day|\d+ days|secure checkout/i);
  });

  it('renders no policy links when Shopify has no such policies', async () => {
    renderWith({...EMPTY_STORE_TRUST});
    await screen.findByText((_, el) => el?.tagName === 'DIV');
    expect(screen.queryAllByRole('link')).toHaveLength(0);
  });
});
