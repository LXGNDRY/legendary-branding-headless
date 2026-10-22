import type {LoaderFunctionArgs} from 'react-router';
import {PRODUCT_CARD_FRAGMENT, type ProductCardFragment} from '~/components/ui/ProductCard';
import {rateLimitMiddleware} from '~/lib/rate-limit';
import {captureError} from '~/lib/monitoring';
import {MAX_WISHLIST_ITEMS} from '~/lib/wishlist';

const PRODUCT_GID = /^gid:\/\/shopify\/Product\/\d{1,20}$/;

const WISHLIST_PRODUCTS_QUERY = `#graphql
  query WishlistProducts($ids: [ID!]!, $country: CountryCode, $language: LanguageCode)
    @inContext(country: $country, language: $language) {
    nodes(ids: $ids) {
      __typename
      ... on Product {
        ...ProductCard
      }
    }
  }
  ${PRODUCT_CARD_FRAGMENT}
` as const;

// NOTE: private and uncacheable -- prices and availability are the shopper's live market data.
const HEADERS = {'Cache-Control': 'private, no-store', Vary: 'Cookie'} as const;

/**
 * Live card data for wishlist entries — GET /api/wishlist-products?ids=gid1,gid2
 *
 * Returns `{products: {[gid]: card | null}}` in the active market. `null`
 * means the product was deleted, unpublished or is unavailable in this market.
 */
export async function loader({request, context}: LoaderFunctionArgs) {
  const limited = rateLimitMiddleware(request, 'wishlist-products', 60);
  if (limited) return limited;

  const raw = new URL(request.url).searchParams.get('ids') ?? '';
  const ids = [...new Set(raw.split(',').map((id) => id.trim()).filter(Boolean))];
  if (ids.length > MAX_WISHLIST_ITEMS || !ids.every((id) => PRODUCT_GID.test(id))) {
    return Response.json({error: 'Invalid product ids.'}, {status: 400, headers: {'Cache-Control': 'no-store'}});
  }
  if (ids.length === 0) return Response.json({products: {}}, {headers: HEADERS});

  try {
    const {nodes} = await context.storefront.query(WISHLIST_PRODUCTS_QUERY, {
      variables: {
        ids,
        country: context.storefront.i18n.country,
        language: context.storefront.i18n.language,
      },
    });
    const products: Record<string, ProductCardFragment | null> = {};
    ids.forEach((id, index) => {
      const node = nodes[index];
      products[id] = node && node.__typename === 'Product' ? (node as unknown as ProductCardFragment) : null;
    });
    return Response.json({products}, {headers: HEADERS});
  } catch (error) {
    captureError(error, {route: 'api.wishlist-products', failure: 'storefront'});
    return Response.json({error: 'Could not load saved items.'}, {status: 502, headers: {'Cache-Control': 'no-store'}});
  }
}
