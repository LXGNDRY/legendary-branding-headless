#!/usr/bin/env node
/**
 * Checkout boundary verification (SEO-04). Creates an anonymous cart via the
 * Storefront API, records the host of the Shopify-issued checkoutUrl and the
 * first-hop Location it serves, then clears the cart. No order is submitted.
 *
 * Usage:
 *   PUBLIC_STORE_DOMAIN=lngndny.myshopify.com \
 *   PUBLIC_STOREFRONT_API_TOKEN=... \
 *   SHOPIFY_STOREFRONT_API_VERSION=2026-04 \
 *   node scripts/seo-checkout-boundary.mjs --out docs/audits/<date>/SEO_CHECKOUT_VERIFICATION.json
 */
import {writeFileSync, mkdirSync} from 'node:fs';
import {dirname} from 'node:path';

const USER_AGENT = 'LegendaryBrandingCheckoutBoundary/1.0 (+contact: lb@legendary-branding.com)';
const EXPECTED_CHECKOUT_HOST = 'www.legendary-branding.com';

function parseArgs(argv) {
  const out = {out: null};
  for (let i = 2; i < argv.length; i += 1) {
    if (argv[i] === '--out') out.out = argv[i + 1];
  }
  return out;
}

async function storefrontGraphql(query, variables = {}) {
  const domain = process.env.PUBLIC_STORE_DOMAIN;
  const token = process.env.PUBLIC_STOREFRONT_API_TOKEN;
  const version = process.env.SHOPIFY_STOREFRONT_API_VERSION || '2026-04';
  if (!domain || !token) throw new Error('PUBLIC_STORE_DOMAIN and PUBLIC_STOREFRONT_API_TOKEN must be set');
  const response = await fetch(`https://${domain}/api/${version}/graphql.json`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-shopify-storefront-access-token': token,
      'user-agent': USER_AGENT,
    },
    body: JSON.stringify({query, variables}),
  });
  const payload = await response.json();
  if (payload.errors?.length) throw new Error(`Storefront GraphQL error: ${JSON.stringify(payload.errors)}`);
  return payload.data;
}

const PRODUCT_QUERY = `
  query FirstPurchasableVariant {
    products(first: 10, sortKey: TITLE) {
      nodes {
        handle
        variants(first: 5) {
          nodes {
            id
            availableForSale
          }
        }
      }
    }
  }
`;

const CART_CREATE = `
  mutation CartCreate($input: CartInput!) {
    cartCreate(input: $input) {
      cart { id checkoutUrl }
      userErrors { field message }
    }
  }
`;

const CART_DELETE_LINES = `
  mutation CartDeleteLines($cartId: ID!, $lineIds: [ID!]!) {
    cartLinesRemove(cartId: $cartId, lineIds: $lineIds) {
      cart { id totalQuantity }
      userErrors { field message }
    }
  }
`;

async function firstAvailableVariantId() {
  const data = await storefrontGraphql(PRODUCT_QUERY);
  for (const product of data?.products?.nodes ?? []) {
    for (const variant of product.variants?.nodes ?? []) {
      if (variant.availableForSale) return variant.id;
    }
  }
  throw new Error('No purchasable variant found; cannot verify checkout boundary');
}

async function createAnonymousCart(variantId) {
  const data = await storefrontGraphql(CART_CREATE, {input: {lines: [{merchandiseId: variantId, quantity: 1}]}});
  const errors = data?.cartCreate?.userErrors ?? [];
  if (errors.length) throw new Error(`cartCreate userErrors: ${JSON.stringify(errors)}`);
  if (!data?.cartCreate?.cart?.checkoutUrl) throw new Error('cartCreate returned no checkoutUrl');
  return data.cartCreate.cart;
}

async function readFirstHop(url) {
  const response = await fetch(url, {
    method: 'GET',
    redirect: 'manual',
    headers: {'user-agent': USER_AGENT, accept: 'text/html'},
  });
  return {
    status: response.status,
    location: response.headers.get('location'),
    contentType: response.headers.get('content-type'),
  };
}

async function clearCart(cartId) {
  try {
    const data = await storefrontGraphql(
      `query C($id: ID!) { cart(id: $id) { lines(first: 20) { nodes { id } } } }`,
      {id: cartId},
    );
    const lineIds = (data?.cart?.lines?.nodes ?? []).map((line) => line.id);
    if (lineIds.length) await storefrontGraphql(CART_DELETE_LINES, {cartId, lineIds});
    return {cleared: true, removedLines: lineIds.length};
  } catch (error) {
    return {cleared: false, error: String(error)};
  }
}

async function main() {
  const args = parseArgs(process.argv);
  const started = new Date().toISOString();
  const evidence = {
    date: started.slice(0, 10),
    startedAt: started,
    scope: 'Anonymous cart verification per docs/HYDROGEN_TECHNICAL_SEO_PLAN.md SEO-04; no customer data or order submission',
    publicCheckoutDomain: process.env.PUBLIC_CHECKOUT_DOMAIN ?? null,
    expectedCheckoutHost: EXPECTED_CHECKOUT_HOST,
  };

  const variantId = await firstAvailableVariantId();
  const cart = await createAnonymousCart(variantId);
  evidence.cartId = cart.id;
  evidence.checkoutUrl = cart.checkoutUrl;
  const parsed = new URL(cart.checkoutUrl);
  evidence.checkoutHost = parsed.hostname;
  evidence.checkoutHostIsExpected = parsed.hostname === EXPECTED_CHECKOUT_HOST;

  const hop = await readFirstHop(cart.checkoutUrl);
  evidence.firstHopStatus = hop.status;
  evidence.firstHopLocation = hop.location;
  evidence.firstHopContentType = hop.contentType;
  if (hop.location) {
    try {
      evidence.firstHopLocationHost = new URL(hop.location, cart.checkoutUrl).hostname;
    } catch {
      evidence.firstHopLocationHost = null;
    }
  }

  const cleanup = await clearCart(cart.id);
  evidence.testCartCleared = cleanup.cleared;
  evidence.cleanup = cleanup;
  evidence.finishedAt = new Date().toISOString();

  evidence.pass =
    evidence.checkoutHostIsExpected === true &&
    typeof evidence.checkoutUrl === 'string' &&
    evidence.cartId.length > 0;

  const serialized = `${JSON.stringify(evidence, null, 2)}\n`;
  if (args.out) {
    mkdirSync(dirname(args.out), {recursive: true});
    writeFileSync(args.out, serialized);
    process.stdout.write(`${args.out}\n`);
  } else {
    process.stdout.write(serialized);
  }
  if (!evidence.pass) {
    process.stderr.write(`Checkout boundary verification FAILED: host=${evidence.checkoutHost}\n`);
    process.exit(1);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((error) => {
    process.stderr.write(`${error.stack ?? error}\n`);
    process.exit(1);
  });
}
