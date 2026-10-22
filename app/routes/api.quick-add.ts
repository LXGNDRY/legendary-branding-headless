import type {LoaderFunctionArgs} from 'react-router';
import {CacheFresh} from '~/lib/cache';
import {fetchAllPages} from '~/lib/pagination';
import {rateLimitMiddleware} from '~/lib/rate-limit';

const QUICK_ADD_PRODUCT_QUERY = `#graphql
  query QuickAddProduct($handle: String!, $after: String, $country: CountryCode, $language: LanguageCode)
    @inContext(country: $country, language: $language) {
    product(handle: $handle) {
      id
      title
      handle
      featuredImage { url altText width height }
      options {
        name
        optionValues {
          name
          swatch {
            color
            image { previewImage { url } }
          }
        }
      }
      variants(first: 100, after: $after) {
        pageInfo { hasNextPage endCursor }
        nodes {
          id
          availableForSale
          selectedOptions { name value }
          price { amount currencyCode }
          compareAtPrice { amount currencyCode }
          image { url altText width height }
        }
      }
    }
  }
` as const;

/**
 * Quick-add data for product cards -- GET /api/quick-add?handle=...
 *
 * Returns the options and variants a card's quick-add modal needs so the
 * customer picks color and size before anything is added to the bag.
 */
export async function loader({request, context}: LoaderFunctionArgs) {
  const rateLimitResponse = rateLimitMiddleware(request, 'quick-add', 60);
  if (rateLimitResponse) return rateLimitResponse;

  const handle = new URL(request.url).searchParams.get('handle')?.trim();
  if (!handle) return Response.json({product: null}, {status: 400, headers: {'Cache-Control': 'no-store'}});

  try {
    // NOTE: variants are read page by page so a product with more than 100 variants keeps every selectable option.
    const first: {product?: object | null} = {};
    const variants = await fetchAllPages(async (after) => {
      const result = await context.storefront.query(QUICK_ADD_PRODUCT_QUERY, {
        variables: {
          handle,
          after,
          country: context.storefront.i18n.country,
          language: context.storefront.i18n.language,
        },
        cache: CacheFresh(),
      });
      if (after === null) first.product = result.product;
      return result.product?.variants;
    });
    const product = first.product ? {...first.product, variants: {nodes: variants}} : null;
    return Response.json(
      {product: product ?? null},
      {
        status: product ? 200 : 404,
        // NOTE: private -- the response varies by the session's market
        // (currency, translations), which the URL doesn't carry.
        headers: {'Cache-Control': product ? 'private, max-age=60' : 'no-store'},
      },
    );
  } catch {
    return Response.json({product: null}, {status: 500, headers: {'Cache-Control': 'no-store'}});
  }
}
