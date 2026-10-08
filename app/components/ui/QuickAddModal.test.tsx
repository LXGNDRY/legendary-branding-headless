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
  const Stub = createRoutesStub([
    {path: '/', Component: () => <QuickAddModal handle={product.handle} title={product.title} onClose={() => {}} />},
    {path: '/api/quick-add', loader: () => ({product})},
    {path: '/cart', action: cartAction},
  ]);
  render(<Stub initialEntries={['/']} />);
  return cartAction;
}

describe('QuickAddModal', () => {
  afterEach(cleanup);

  it('never adds a default variant: add stays disabled until color and size are chosen', async () => {
    const cartAction = renderModal();
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
});
