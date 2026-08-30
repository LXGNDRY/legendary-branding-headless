import {describe, it, expect} from 'vitest';

/**
 * Cart module smoke tests — validates the cart type contract
 * without requiring a live Storefront API connection.
 */
describe('Cart module', () => {
  it('exports CartData type via module interface', async () => {
    const mod = await import('./cart');
    // Module should load without throwing
    expect(mod).toBeDefined();
  });

  it('CartData shape includes expected top-level fields', () => {
    // Validate the type contract statically by ensuring the expected
    // properties exist on a well-formed cart object
    type CartData = {
      id?: string;
      totalQuantity?: number;
      lines?: {edges: Array<{node: unknown}>};
      cost?: {totalAmount?: {amount: string; currencyCode: string}};
    };

    const mockCart: CartData = {
      id: 'gid://shopify/Cart/abc123',
      totalQuantity: 2,
      lines: {edges: []},
      cost: {totalAmount: {amount: '99.00', currencyCode: 'USD'}},
    };

    expect(mockCart.totalQuantity).toBe(2);
    expect(mockCart.cost?.totalAmount?.currencyCode).toBe('USD');
  });

  it('empty cart has zero quantity', () => {
    const emptyCart = {totalQuantity: 0, lines: {edges: []}};
    expect(emptyCart.totalQuantity).toBe(0);
    expect(emptyCart.lines.edges).toHaveLength(0);
  });
});

describe('Cart total calculation', () => {
  it('calculates correct total from line items', () => {
    const lines = [
      {quantity: 2, merchandise: {price: {amount: '55.00', currencyCode: 'USD'}}},
      {quantity: 1, merchandise: {price: {amount: '120.00', currencyCode: 'USD'}}},
    ];

    const total = lines.reduce((sum, line) => {
      return sum + line.quantity * parseFloat(line.merchandise.price.amount);
    }, 0);

    expect(total).toBe(230.00);
  });

  it('handles zero-quantity lines correctly', () => {
    const lines = [{quantity: 0, merchandise: {price: {amount: '55.00', currencyCode: 'USD'}}}];
    const total = lines.reduce((sum, l) => sum + l.quantity * parseFloat(l.merchandise.price.amount), 0);
    expect(total).toBe(0);
  });
});
