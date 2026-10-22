import {describe, expect, it} from 'vitest';
import {
  basketFromCart,
  basketFromLineChange,
  basketFromProducts,
  ga4Basket,
  metaBasket,
  metaViewContent,
  numericId,
  tiktokBasket,
} from '~/lib/analytics-events';

const product = {
  id: 'gid://shopify/Product/111',
  title: 'Legend Tee',
  price: '49.00',
  vendor: 'LB',
  variantId: 'gid://shopify/ProductVariant/222',
  variantTitle: 'M',
  quantity: 1,
  productType: 'Tee',
};

const line = (quantity: number) => ({
  quantity,
  cost: {amountPerQuantity: {amount: '49.00', currencyCode: 'USD'}},
  merchandise: {
    id: 'gid://shopify/ProductVariant/222',
    title: 'M',
    product: {id: 'gid://shopify/Product/111', title: 'Legend Tee', vendor: 'LB', productType: 'Tee'},
  },
});

describe('numericId', () => {
  it('takes the numeric tail of a Shopify gid', () => {
    expect(numericId('gid://shopify/Product/111')).toBe('111');
    expect(numericId('gid://shopify/Product/111?key=abc')).toBe('111');
    expect(numericId('nope')).toBeUndefined();
    expect(numericId(null)).toBeUndefined();
  });
});

describe('product view', () => {
  const basket = basketFromProducts([product], 'USD')!;

  it('GA4: item with id, variant, price, quantity and a currency/value', () => {
    expect(ga4Basket(basket)).toEqual({
      currency: 'USD',
      value: 49,
      items: [{item_id: '111', item_name: 'Legend Tee', item_variant: '222', item_brand: 'LB', item_category: 'Tee', price: 49, quantity: 1}],
    });
  });

  it('Meta: ViewContent with SKU-level ids, contents, value and currency', () => {
    expect(metaViewContent(basket)).toMatchObject({
      content_type: 'product',
      content_ids: ['222'],
      contents: [{id: '222', quantity: 1, item_price: 49}],
      value: 49,
      currency: 'USD',
      content_name: 'Legend Tee',
    });
  });

  it('TikTok: contents with content_id, type, name, quantity and price', () => {
    expect(tiktokBasket(basket)).toEqual({
      contents: [{content_id: '222', content_type: 'product', content_name: 'Legend Tee', quantity: 1, price: 49}],
      value: 49,
      currency: 'USD',
    });
  });

  it('is skipped without a currency, a usable id or a usable price', () => {
    expect(basketFromProducts([product], undefined)).toBeNull();
    expect(basketFromProducts([{...product, id: 'bad'}], 'USD')).toBeNull();
    expect(basketFromProducts([{...product, price: 'free'}], 'USD')).toBeNull();
  });
});

describe('cart events', () => {
  it('uses the cart total and every line for view/begin checkout', () => {
    const cart = {cost: {totalAmount: {amount: '98.00', currencyCode: 'USD'}}, lines: {nodes: [line(2)]}};
    const basket = basketFromCart(cart)!;
    expect(basket.value).toBe(98);
    expect(basket.items).toHaveLength(1);
    expect(metaBasket(basket)).toMatchObject({num_items: 2, value: 98, currency: 'USD'});
  });

  it('reports only the units added, at the unit price', () => {
    const basket = basketFromLineChange('add', {previous: line(1), current: line(3)})!;
    expect(basket.items[0].quantity).toBe(2);
    expect(basket.value).toBe(98);
  });

  it('treats a new line as all-new units and a removal as the units removed', () => {
    expect(basketFromLineChange('add', {current: line(1)})!.items[0].quantity).toBe(1);
    expect(basketFromLineChange('remove', {previous: line(3), current: line(1)})!.items[0].quantity).toBe(2);
    expect(basketFromLineChange('remove', {previous: line(2)})!.items[0].quantity).toBe(2);
  });

  it('sends nothing when the quantity did not actually change in that direction', () => {
    expect(basketFromLineChange('add', {previous: line(3), current: line(1)})).toBeNull();
    expect(basketFromLineChange('remove', {previous: line(1), current: line(3)})).toBeNull();
  });

  it('is skipped for an empty cart', () => {
    expect(basketFromCart({cost: {totalAmount: {amount: '0', currencyCode: 'USD'}}, lines: {nodes: []}})).toBeNull();
    expect(basketFromCart(null)).toBeNull();
  });
});
