/**
 * Shopify Admin API discount client — server-only.
 *
 * The Storefront API has no query to list a shop's active discounts (only
 * `cart.discountCodes`/`cart.discountAllocations` for a specific cart once
 * items are already in it), so there is no way to advertise "25% off
 * outerwear" or "Buy 1 Get 1 50% off" to a browsing customer before they add
 * anything to cart without reading the Admin API's `discountNodes`. This is
 * the one place this storefront reads from the Admin API rather than the
 * Storefront API -- read-only, and only this one query.
 *
 * Requires a private Admin API access token with the `read_discounts` scope
 * (Shopify Admin -> Settings -> Apps and sales channels -> Develop apps ->
 * create/edit a custom app -> Configure Admin API scopes). Degrades to an
 * empty list rather than throwing if the token is unset or the request
 * fails, matching the same optional-third-party-integration pattern used
 * for Judge.me (~/lib/judgeme.ts) -- this feature must never break the page
 * it decorates.
 *
 * Deliberately queries only the merchant-configured discount types
 * (Basic/Bxgy/FreeShipping) and NOT DiscountAutomaticApp/DiscountCodeApp --
 * those are configured via Shopify Functions, whose `title`/`summary`
 * field support isn't guaranteed the same way (confirmed against the
 * 2025-10 Admin schema: DiscountCodeApp exposes neither `summary` nor
 * `customerSelection`, and DiscountAutomaticApp exposes no `summary`
 * either -- querying them broke the entire request with a GraphQL
 * validation error, silently emptying every discount, Basic/Bxgy included,
 * since it's one query). An app-managed discount's "summary" also isn't
 * necessarily meant for direct customer-facing display the way a
 * merchant-authored one is, so omitting them entirely is the safer
 * default, not just the schema-safe one.
 */

import {CacheLong, type WithCache} from '@shopify/hydrogen';

const DEFAULT_ADMIN_API_VERSION = '2025-10';

export interface ActiveDiscount {
  id: string;
  title: string;
  /** Shopify's own human-readable summary, e.g. "25% off Outerwear". */
  summary: string;
  kind: 'automatic' | 'code';
  /** Only present for kind: 'code' -- the code a customer must enter. */
  code?: string;
}

interface DiscountCodeNode {
  code: string;
}

interface DiscountCustomerGetsBase {
  title: string;
  summary: string;
}

interface DiscountNodeApiResult {
  id: string;
  discount:
    | ({__typename: 'DiscountAutomaticBasic' | 'DiscountAutomaticBxgy' | 'DiscountAutomaticFreeShipping'} & DiscountCustomerGetsBase)
    | ({
        __typename: 'DiscountCodeBasic' | 'DiscountCodeBxgy' | 'DiscountCodeFreeShipping';
        codes: {nodes: DiscountCodeNode[]};
        customerSelection: {__typename: string};
      } & DiscountCustomerGetsBase)
    | {__typename: string};
}

interface AdminDiscountsResponse {
  data?: {
    discountNodes?: {
      nodes?: DiscountNodeApiResult[];
    };
  };
  errors?: Array<{message: string}>;
}

// Deliberately NOT tagged with the `#graphql` magic comment -- that tag
// tells this repo's codegen (via .graphqlrc.ts's `documents` glob, which
// matches this whole file) to validate the template literal against the
// Storefront API schema. This query targets the Admin API instead, whose
// schema is entirely different (discountNodes/DiscountAutomaticBasic/etc.
// don't exist in the Storefront schema at all), so tagging it broke
// codegen with "Cannot query field 'discountNodes' on type 'QueryRoot'".
const ACTIVE_DISCOUNTS_QUERY = `
  query ActiveDiscounts {
    discountNodes(first: 20, query: "status:active") {
      nodes {
        id
        discount {
          __typename
          ... on DiscountAutomaticBasic { title summary }
          ... on DiscountAutomaticBxgy { title summary }
          ... on DiscountAutomaticFreeShipping { title summary }
          ... on DiscountCodeBasic {
            title
            summary
            customerSelection { __typename }
            codes(first: 1) { nodes { code } }
          }
          ... on DiscountCodeBxgy {
            title
            summary
            customerSelection { __typename }
            codes(first: 1) { nodes { code } }
          }
          ... on DiscountCodeFreeShipping {
            title
            summary
            customerSelection { __typename }
            codes(first: 1) { nodes { code } }
          }
        }
      }
    }
  }
`;

function parseDiscountNodes(nodes: DiscountNodeApiResult[]): ActiveDiscount[] {
  return nodes
    .map((node): ActiveDiscount | null => {
      const d = node.discount;
      if (!('title' in d) || !('summary' in d)) return null;

      if (d.__typename === 'DiscountCodeBasic' || d.__typename === 'DiscountCodeBxgy' || d.__typename === 'DiscountCodeFreeShipping') {
        if (d.customerSelection.__typename !== 'DiscountCustomerAll') return null;
        const code = d.codes.nodes[0]?.code;
        if (!code) return null;
        return {id: node.id, title: d.title, summary: d.summary, kind: 'code', code};
      }

      return {id: node.id, title: d.title, summary: d.summary, kind: 'automatic'};
    })
    .filter((d): d is ActiveDiscount => d !== null);
}

interface FetchActiveDiscountsOptions {
  accessToken: string;
  shopDomain: string;
  apiVersion?: string;
  /** Hydrogen's cache-wrapped fetch (see app/lib/context.ts) -- caches this
      POST request through Oxygen's Cache API with a real TTL. Cloudflare's
      Cache API (and its `cf.cacheEverything` fetch option) only caches GET
      requests, so without this the Admin API call would sit on the
      critical path of every single page view. */
  withCache: WithCache;
}

/**
 * Fetches the shop's currently active discounts, filtered to ones safe to
 * advertise publicly: automatic discounts (no code needed) and code
 * discounts whose `customerSelection` is `DiscountCustomerAll` (a
 * storewide code like "WELCOME_20"). Discounts restricted to specific
 * customers (e.g. a one-off abandoned-cart or win-back code generated for
 * a single named customer) are deliberately excluded -- those are not a
 * sitewide promotion, and advertising them to every visitor would be
 * misleading.
 */
export async function fetchActiveDiscounts({
  accessToken,
  shopDomain,
  apiVersion = DEFAULT_ADMIN_API_VERSION,
  withCache,
}: FetchActiveDiscountsOptions): Promise<ActiveDiscount[]> {
  const url = `https://${shopDomain}/admin/api/${apiVersion}/graphql.json`;

  let data: AdminDiscountsResponse | null;
  try {
    const result = await withCache.fetch<AdminDiscountsResponse>(
      url,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Shopify-Access-Token': accessToken,
        },
        body: JSON.stringify({query: ACTIVE_DISCOUNTS_QUERY}),
        signal: AbortSignal.timeout(5000),
      },
      {
        displayName: 'Active discounts (Admin API)',
        // Active discounts change infrequently -- a long TTL keeps this
        // read-only Admin API call off the hot path for every page view.
        cacheStrategy: CacheLong(),
        cacheKey: ['active-discounts', shopDomain, apiVersion],
        shouldCacheResponse: (body) => !!body?.data && !body.errors?.length,
      },
    );
    data = result.data;
  } catch (error) {
    console.error('[discounts] request failed', error);
    return [];
  }

  if (!data) {
    console.error('[discounts] Admin API returned no data');
    return [];
  }

  if (data.errors?.length) {
    console.error('[discounts] Admin API returned errors', data.errors);
    return [];
  }

  return parseDiscountNodes(data.data?.discountNodes?.nodes ?? []);
}
