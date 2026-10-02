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
 */

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
    | ({__typename: 'DiscountAutomaticApp' | 'DiscountAutomaticBasic' | 'DiscountAutomaticBxgy'} & DiscountCustomerGetsBase)
    | ({
        __typename: 'DiscountCodeApp' | 'DiscountCodeBasic' | 'DiscountCodeBxgy';
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
          ... on DiscountAutomaticApp { title summary }
          ... on DiscountAutomaticBasic { title summary }
          ... on DiscountAutomaticBxgy { title summary }
          ... on DiscountCodeApp {
            title
            summary
            customerSelection { __typename }
            codes(first: 1) { nodes { code } }
          }
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
        }
      }
    }
  }
`;

interface FetchActiveDiscountsOptions {
  accessToken: string;
  shopDomain: string;
  apiVersion?: string;
}

/**
 * Fetches the shop's currently active discounts, filtered to ones safe to
 * advertise publicly: automatic discounts (no code needed) and code
 * discounts whose `customerSelection` is `DiscountCustomerAll` (a storewide
 * code like "WELCOME_20"). Discounts restricted to specific customers (e.g.
 * a one-off abandoned-cart or win-back code generated for a single named
 * customer) are deliberately excluded -- those are not a sitewide
 * promotion, and advertising them to every visitor would be misleading.
 */
export async function fetchActiveDiscounts({
  accessToken,
  shopDomain,
  apiVersion = DEFAULT_ADMIN_API_VERSION,
}: FetchActiveDiscountsOptions): Promise<ActiveDiscount[]> {
  const url = `https://${shopDomain}/admin/api/${apiVersion}/graphql.json`;

  let response: Response;
  try {
    response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Access-Token': accessToken,
      },
      body: JSON.stringify({query: ACTIVE_DISCOUNTS_QUERY}),
      signal: AbortSignal.timeout(5000),
      // Active discounts change infrequently -- a 15-minute-stale list is a
      // non-issue for this content, and caching keeps this read-only Admin
      // API call off the hot path for every single page view.
      cf: {cacheTtl: 900, cacheEverything: true},
    } as RequestInit);
  } catch (error) {
    console.error('[discounts] request failed', error);
    return [];
  }

  if (!response.ok) {
    console.error(`[discounts] Admin API responded with ${response.status}`);
    return [];
  }

  let data: AdminDiscountsResponse;
  try {
    data = await response.json();
  } catch (error) {
    console.error('[discounts] failed to parse response', error);
    return [];
  }

  if (data.errors?.length) {
    console.error('[discounts] Admin API returned errors', data.errors);
    return [];
  }

  const nodes = data.data?.discountNodes?.nodes ?? [];

  return nodes
    .map((node): ActiveDiscount | null => {
      const d = node.discount;
      if (!('title' in d) || !('summary' in d)) return null;

      if (d.__typename === 'DiscountCodeApp' || d.__typename === 'DiscountCodeBasic' || d.__typename === 'DiscountCodeBxgy') {
        if (d.customerSelection.__typename !== 'DiscountCustomerAll') return null;
        const code = d.codes.nodes[0]?.code;
        if (!code) return null;
        return {id: node.id, title: d.title, summary: d.summary, kind: 'code', code};
      }

      return {id: node.id, title: d.title, summary: d.summary, kind: 'automatic'};
    })
    .filter((d): d is ActiveDiscount => d !== null);
}
