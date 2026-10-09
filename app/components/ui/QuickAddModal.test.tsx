// @vitest-environment jsdom
import {cleanup, fireEvent, render, screen, waitFor} from '@testing-library/react';
import {createRoutesStub} from 'react-router';
import '@testing-library/jest-dom/vitest';
import {afterEach, describe, expect, it, vi} from 'vitest';
import QuickAddModal, {type QuickAddProduct} from './QuickAddModal';

const money = {amount: '65.0', currencyCode: 'USD' as const};
const variant = (id: string, color: string, size: string, availableForSale = true) => ({
  id,
  availableForSale,
  selectedOptions: [
    {name: 'Color', value: color},
    {name: 'Size', value: size},
  ],
  price: money,
  compareAtPrice: null,
  image: null,
});

const product: QuickAddProduct = {
  id: 'gid://shopify/Product/1',
  title: 'Heavyweight Hoodie',
  handle: 'heavyweight-hoodie',
  featuredImage: null,
  options: [
    {name: 'Color', optionValues: [{name: 'Black'}, {name: 'Bone'}]},
    {name: 'Size', optionValues: [{name: 'S'}, {name: 'M'}]},
  ],
  variants: {nodes: [variant('v1', 'Black', 'S'), variant('v2', 'Black', 'M', false), variant('v3', 'Bone', 'M')]},
};

function renderModal(cartAction = vi.fn(() => ({}))) {
  // NOTE: a fresh product object on every load, like a real network response after revalidation.
  const loader = vi.fn(() => ({product: structuredClone(product)}));
  const Stub = createRoutesStub([
    {path: '/', Component: () => <QuickAddModal handle={product.handle} title={product.title} onClose={() => {}} />},
    {path: '/api/quick-add', loader},
    {path: '/cart', action: cartAction},
  ]);
  render(<Stub initialEntries={['/']} />);
  return {cartAction, loader};
}

describe('QuickAddModal', () => {
  afterEach(cleanup);

  it('never adds a default variant: add stays disabled until color and size are chosen', async () => {
    const {cartAction} = renderModal();
    const add = await screen.findByTestId('quick-add-submit');
    expect(add).toBeDisabled();

    fireEvent.click(screen.getByRole('button', {name: 'Color: Black'}));
    expect(add).toBeDisabled();
    expect(screen.getByRole('button', {name: 'Size: M (unavailable)'})).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', {name: 'Size: S'}));
    expect(add).toBeEnabled();
    fireEvent.click(add);

    await waitFor(() => expect(cartAction).toHaveBeenCalledTimes(1));
    const [{request}] = cartAction.mock.calls[0] as unknown as [{request: Request}];
    const form = await request.formData();
    expect(String(form.get('cartFormInput'))).toContain('"merchandiseId":"v1"');
  });

  it("keeps the customer's choices when the product data reloads", async () => {
    const {cartAction, loader} = renderModal();
    await screen.findByTestId('quick-add-submit');

    fireEvent.click(screen.getByRole('button', {name: 'Color: Black'}));
    fireEvent.click(screen.getByRole('button', {name: 'Size: S'}));
    fireEvent.click(screen.getByTestId('quick-add-submit'));

    // The cart action revalidates the product loader, which hands the modal a new object.
    await waitFor(() => expect(cartAction).toHaveBeenCalledTimes(1));
    await waitFor(() => expect(loader.mock.calls.length).toBeGreaterThanOrEqual(2));
    await new Promise((resolve) => setTimeout(resolve, 50));

    expect(screen.getByRole('button', {name: 'Color: Black'})).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('button', {name: 'Size: S'})).toHaveAttribute('aria-pressed', 'true');
  });
});
