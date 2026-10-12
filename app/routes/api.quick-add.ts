import type {LoaderFunctionArgs} from 'react-router';
import {CacheShort} from '@shopify/hydrogen';
import {rateLimitMiddleware} from '~/lib/rate-limit';

const QUICK_ADD_PRODUCT_QUERY = `#graphql
  query QuickAddProduct($handle: String!, $country: CountryCode, $language: LanguageCode)
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
      variants(first: 100) {
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
  if (!handle) return Response.json({product: null}, {status: 400});

  try {
    const {product} = await context.storefront.query(QUICK_ADD_PRODUCT_QUERY, {
      variables: {
        handle,
        country: context.storefront.i18n.country,
        language: context.storefront.i18n.language,
      },
      cache: CacheShort(),
    });
    return Response.json(
      {product: product ?? null},
      {
        status: product ? 200 : 404,
        // NOTE: private -- the response varies by the session's market
        // (currency, translations), which the URL doesn't carry.
        headers: {'Cache-Control': 'private, max-age=60'},
      },
    );
  } catch {
    return Response.json({product: null}, {status: 500});
  }
}
