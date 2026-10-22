import type {ActionFunctionArgs, LoaderFunctionArgs} from 'react-router';
import {enforceRatePolicy} from '~/lib/rate-limit';
import {requireSameOrigin} from '~/lib/security';
import {captureError} from '~/lib/monitoring';
import {requestKlaviyoBackInStock} from '~/lib/klaviyo';

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const VARIANT_GID = /^gid:\/\/shopify\/ProductVariant\/(\d+)$/;
const PRODUCT_GID = /^gid:\/\/shopify\/Product\/\d+$/;

const WAITLIST_VARIANT_QUERY = `#graphql
  query WaitlistVariant($id: ID!, $country: CountryCode, $language: LanguageCode)
  @inContext(country: $country, language: $language) {
    node(id: $id) {
      __typename
      ... on ProductVariant {
        id
        availableForSale
        product {
          id
        }
      }
    }
  }
` as const;

function clean(value: FormDataEntryValue | null, max: number) {
  return typeof value === 'string'
    ? value.replace(/\p{Cc}/gu, '').trim().slice(0, max)
    : '';
}

export async function action({request, context}: ActionFunctionArgs) {
  if (request.method !== 'POST') {
    return Response.json({error: 'Method not allowed'}, {status: 405});
  }
  const originError = requireSameOrigin(request);
  if (originError) return originError;
  const limited = enforceRatePolicy(request, 'waitlist');
  if (limited) return limited;

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return Response.json({error: 'Invalid request.'}, {status: 400});
  }
  const email = clean(form.get('email'), 254).toLowerCase();
  const productId = clean(form.get('productId'), 128);
  const variantId = clean(form.get('variantId'), 128);

  if (!EMAIL.test(email)) {
    return Response.json({error: 'Please enter a valid email address.'}, {status: 400});
  }
  const variantMatch = VARIANT_GID.exec(variantId);
  if (!variantMatch || !PRODUCT_GID.test(productId)) {
    return Response.json({error: 'A product and variant are required.'}, {status: 400});
  }

  const env = context.env as Env;
  if (!env.PRIVATE_KLAVIYO_API_KEY) {
    captureError(
      new Error('Klaviyo waitlist is not configured'),
      {route: 'api.waitlist', failure: 'configuration'},
    );
    return Response.json(
      {error: 'Back-in-stock signup is temporarily unavailable.'},
      {status: 503},
    );
  }

  // Never trust client-supplied IDs: the variant must exist, belong to the
  // submitted product, and actually be sold out.
  const {node} = await context.storefront.query(WAITLIST_VARIANT_QUERY, {
    variables: {
      id: variantId,
      country: context.storefront.i18n.country,
      language: context.storefront.i18n.language,
    },
  });
  if (!node || node.__typename !== 'ProductVariant' || node.product.id !== productId) {
    return Response.json({error: 'That item could not be found.'}, {status: 404});
  }
  if (node.availableForSale) {
    return Response.json({error: 'This item is in stock right now.'}, {status: 409});
  }

  const result = await requestKlaviyoBackInStock({
    apiKey: env.PRIVATE_KLAVIYO_API_KEY,
    email,
    shopifyVariantId: variantMatch[1],
  });
  if (!result.ok) {
    captureError(
      result.kind === 'network'
        ? result.error
        : new Error(`Klaviyo returned HTTP ${result.status}`),
      {
        route: 'api.waitlist',
        provider: 'klaviyo',
        failure: result.kind,
        ...(result.kind === 'http' ? {status: result.status} : {}),
      },
    );
    return Response.json(
      {error: 'Unable to save your request. Please try again.'},
      {status: 502},
    );
  }

  return Response.json({success: true, message: 'Restock request received.'});
}

export function loader(_args: LoaderFunctionArgs) {
  return Response.json({error: 'Method not allowed'}, {status: 405});
}
