import type {LoaderFunctionArgs} from 'react-router';
import {enforceRatePolicy} from '~/lib/rate-limit';

const PREDICTIVE_SEARCH_QUERY = `#graphql
  query PredictiveSearch($query: String!, $limit: Int = 6, $country: CountryCode, $language: LanguageCode)
    @inContext(country: $country, language: $language) {
    predictiveSearch(query: $query, limit: $limit, unavailableProducts: HIDE) {
      products {
        id
        title
        handle
        vendor
        featuredImage { url altText width height }
        priceRange {
          minVariantPrice {
            amount
            currencyCode
          }
        }
        reviewBadge: metafield(namespace: "judgeme", key: "badge") {
          value
        }
      }
      collections {
        id
        title
        handle
        image { url altText width height }
      }
      queries {
        text
      }
    }
  }
` as const;

const empty = {products: [], collections: [], queries: []};

/**
 * Predictive search API endpoint — GET /api/search?q=query
 *
 * Returns JSON with products, collections, and query suggestions.
 * Used by the search typeahead component.
 */
export async function loader({request, context}: LoaderFunctionArgs) {
  // Rate limiting — 60 requests per minute per IP
  const rateLimitResponse = enforceRatePolicy(request, 'search');
  if (rateLimitResponse) return rateLimitResponse;

  const url = new URL(request.url);
  const q = url.searchParams.get('q')?.trim() ?? '';

  if (!q || q.length < 2) {
    return jsonResponse(empty);
  }

  try {
    const data = await context.storefront.query(PREDICTIVE_SEARCH_QUERY, {
      variables: {
        query: q,
        limit: 6,
        country: context.storefront.i18n.country,
        language: context.storefront.i18n.language,
      },
    });

    const ps = data.predictiveSearch as {
      products: unknown[];
      collections: unknown[];
      queries: unknown[];
    };

    return jsonResponse({
      products: ps.products ?? [],
      collections: ps.collections ?? [],
      queries: ps.queries ?? [],
    });
  } catch (error) {
    console.error('Predictive search error:', error);
    return jsonResponse(empty, 500);
  }
}

function jsonResponse(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      // NOTE: private -- results carry the session's market (currency, language)
      // but the URL doesn't, so a shared cache would serve one shopper's market
      // to another. Errors are never cached at all.
      'Cache-Control': status === 200 ? 'private, max-age=60' : 'no-store',
    },
  });
}
