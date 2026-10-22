/**
 * Pure mappers from Hydrogen analytics payloads to each channel's event schema.
 *
 * Purchase is intentionally absent: it happens on Shopify's checkout, so it must come from the checkout-side
 * integrations (Shopify customer events / the channel apps), not from this storefront.
 */

type MoneyLike = {amount?: string | number | null; currencyCode?: string | null} | null | undefined;

export type ProductInput = {
  id: string;
  title: string;
  price: string | number;
  vendor?: string | null;
  variantId?: string | null;
  variantTitle?: string | null;
  quantity?: number | null;
  sku?: string | null;
  productType?: string | null;
};

export type CartLineInput = {
  quantity?: number | null;
  cost?: {amountPerQuantity?: MoneyLike; totalAmount?: MoneyLike} | null;
  merchandise?: {
    id?: string | null;
    title?: string | null;
    sku?: string | null;
    product?: {id?: string | null; title?: string | null; vendor?: string | null; productType?: string | null} | null;
  } | null;
};

export type CartInput = {
  cost?: {totalAmount?: MoneyLike} | null;
  // NOTE: the storefront cart query returns `edges[].node`; `nodes` is accepted for flattened carts.
  lines?: {
    edges?: ReadonlyArray<{node?: CartLineInput | null} | null | undefined> | null;
    nodes?: ReadonlyArray<CartLineInput | null | undefined> | null;
  } | null;
} | null | undefined;

/** The numeric tail of a Shopify global id, which is what channel catalogs use. */
export function numericId(gid: string | null | undefined): string | undefined {
  if (!gid) return undefined;
  const match = /(\d+)(?:\?.*)?$/.exec(gid);
  return match ? match[1] : undefined;
}

function money(value: string | number | null | undefined): number | undefined {
  if (value === null || value === undefined || value === '') return undefined;
  const n = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(n) ? Math.round(n * 100) / 100 : undefined;
}

/** A normalized line every channel adapter reads from. */
export type TrackedItem = {
  id: string;
  variantId?: string;
  name: string;
  brand?: string;
  category?: string;
  sku?: string;
  price: number;
  quantity: number;
};

export function itemsFromProducts(products: ReadonlyArray<ProductInput>): TrackedItem[] {
  const items: TrackedItem[] = [];
  for (const p of products) {
    const id = numericId(p.id);
    const price = money(p.price);
    if (!id || price === undefined) continue;
    const quantity = Math.max(1, Math.floor(p.quantity ?? 1));
    items.push({
      id,
      variantId: numericId(p.variantId),
      name: p.title,
      brand: p.vendor || undefined,
      category: p.productType || undefined,
      sku: p.sku || undefined,
      price,
      quantity,
    });
  }
  return items;
}

function itemFromLine(line: CartLineInput | null | undefined, quantity: number): TrackedItem | null {
  if (!line || quantity <= 0) return null;
  const id = numericId(line.merchandise?.product?.id);
  const price = money(line.cost?.amountPerQuantity?.amount);
  if (!id || price === undefined) return null;
  return {
    id,
    variantId: numericId(line.merchandise?.id),
    name: line.merchandise?.product?.title ?? line.merchandise?.title ?? '',
    brand: line.merchandise?.product?.vendor || undefined,
    category: line.merchandise?.product?.productType || undefined,
    sku: line.merchandise?.sku || undefined,
    price,
    quantity,
  };
}

export type Basket = {currency: string; value: number; items: TrackedItem[]};

function basketFrom(items: TrackedItem[], currency: string | null | undefined, value?: number): Basket | null {
  if (!currency || items.length === 0) return null;
  const total = value ?? items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  return {currency, value: Math.round(total * 100) / 100, items};
}

export function basketFromProducts(products: ReadonlyArray<ProductInput>, currency: string | null | undefined): Basket | null {
  return basketFrom(itemsFromProducts(products), currency);
}

/** The whole cart (view cart, begin checkout). Uses the cart's own total when present. */
export function basketFromCart(cart: CartInput): Basket | null {
  const items: TrackedItem[] = [];
  const lines = cart?.lines?.edges ? cart.lines.edges.map((edge) => edge?.node) : (cart?.lines?.nodes ?? []);
  for (const line of lines) {
    const item = itemFromLine(line, Math.floor(line?.quantity ?? 0));
    if (item) items.push(item);
  }
  const total = cart?.cost?.totalAmount;
  return basketFrom(items, total?.currencyCode, money(total?.amount));
}

/** Only the units added or removed by a line update, priced per unit. */
export function basketFromLineChange(
  change: 'add' | 'remove',
  line: {previous?: CartLineInput | null; current?: CartLineInput | null},
): Basket | null {
  const before = Math.floor(line.previous?.quantity ?? 0);
  const after = Math.floor(line.current?.quantity ?? 0);
  const delta = change === 'add' ? after - before : before - after;
  const source = change === 'add' ? line.current : line.previous;
  const item = itemFromLine(source, delta);
  return basketFrom(item ? [item] : [], source?.cost?.amountPerQuantity?.currencyCode);
}

// ---- GA4 -------------------------------------------------------------------------------------------------

const ga4Item = (item: TrackedItem) => ({
  item_id: item.id,
  item_name: item.name,
  ...(item.variantId ? {item_variant: item.variantId} : {}),
  ...(item.brand ? {item_brand: item.brand} : {}),
  ...(item.category ? {item_category: item.category} : {}),
  price: item.price,
  quantity: item.quantity,
});

export const ga4Basket = (basket: Basket) => ({
  currency: basket.currency,
  value: basket.value,
  items: basket.items.map(ga4Item),
});

// ---- Meta Pixel ------------------------------------------------------------------------------------------

// NOTE: ids are numeric Shopify variant ids when known (SKU-level, content_type 'product'), else product ids.
// The owner confirms this matches the catalog the Meta channel syncs before ad optimisation relies on it.
const metaId = (item: TrackedItem) => item.variantId ?? item.id;

export const metaBasket = (basket: Basket) => ({
  content_type: 'product',
  content_ids: basket.items.map(metaId),
  contents: basket.items.map((item) => ({id: metaId(item), quantity: item.quantity, item_price: item.price})),
  value: basket.value,
  currency: basket.currency,
  num_items: basket.items.reduce((sum, item) => sum + item.quantity, 0),
});

export const metaViewContent = (basket: Basket) => ({...metaBasket(basket), content_name: basket.items[0]?.name});

// ---- TikTok Pixel ----------------------------------------------------------------------------------------

export const tiktokBasket = (basket: Basket) => ({
  contents: basket.items.map((item) => ({
    content_id: metaId(item),
    content_type: 'product',
    content_name: item.name,
    quantity: item.quantity,
    price: item.price,
  })),
  value: basket.value,
  currency: basket.currency,
});
