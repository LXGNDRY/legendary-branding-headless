import type {ActionFunctionArgs, LoaderFunctionArgs} from 'react-router';
import {rateLimitMiddleware} from '~/lib/rate-limit';
import {requireSameOrigin} from '~/lib/security';

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

function clean(value: FormDataEntryValue | null, max: number) {
  return typeof value === 'string'
    ? value.replace(/[\u0000-\u001F\u007F-\u009F]/g, '').trim().slice(0, max)
    : '';
}

export async function action({request, context}: ActionFunctionArgs) {
  if (request.method !== 'POST') {
    return Response.json({error: 'Method not allowed'}, {status: 405});
  }
  const originError = requireSameOrigin(request);
  if (originError) return originError;
  const limited = rateLimitMiddleware(request, 'waitlist', 5);
  if (limited) return limited;

  const form = await request.formData();
  const email = clean(form.get('email'), 254).toLowerCase();
  const productId = clean(form.get('productId'), 128);
  const variantId = clean(form.get('variantId'), 128);
  const productTitle = clean(form.get('productTitle'), 180);
  const variantTitle = clean(form.get('variantTitle'), 180);

  if (!EMAIL.test(email)) {
    return Response.json({error: 'Please enter a valid email address.'}, {status: 400});
  }
  if (!productId || !variantId) {
    return Response.json({error: 'A product and variant are required.'}, {status: 400});
  }

  const env = context.env as Env;
  if (!env.PRIVATE_KLAVIYO_API_KEY || !env.PUBLIC_KLAVIYO_WAITLIST_LIST_ID) {
    console.error('[waitlist] Klaviyo waitlist is not configured');
    return Response.json(
      {error: 'Back-in-stock signup is temporarily unavailable.'},
      {status: 503},
    );
  }

  try {
    const response = await fetch(
      'https://a.klaviyo.com/api/profile-subscription-bulk-create-jobs/',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/vnd.api+json',
          revision: '2024-02-15',
          Authorization: `Klaviyo-API-Key ${env.PRIVATE_KLAVIYO_API_KEY}`,
        },
        body: JSON.stringify({
          data: {
            type: 'profile-subscription-bulk-create-job',
            attributes: {custom_source: 'product-back-in-stock'},
            relationships: {
              list: {
                data: {type: 'list', id: env.PUBLIC_KLAVIYO_WAITLIST_LIST_ID},
              },
            },
          },
          included: [{
            type: 'profile',
            attributes: {
              email,
              properties: {
                waitlist_product_id: productId,
                waitlist_variant_id: variantId,
                waitlist_product_title: productTitle,
                waitlist_variant_title: variantTitle,
                waitlist_country: context.storefront.i18n.country,
              },
              subscriptions: {
                email: {marketing: {consent: 'SUBSCRIBED'}},
              },
            },
          }],
        }),
      },
    );

    if (!response.ok) {
      console.error(`[waitlist] Klaviyo API error ${response.status}`);
      return Response.json({error: 'Unable to save your request. Please try again.'}, {status: 502});
    }
    return Response.json({success: true, message: "You're on the list."});
  } catch (error) {
    console.error('[waitlist] Klaviyo network error', error);
    return Response.json({error: 'Unable to save your request. Please try again.'}, {status: 502});
  }
}

export function loader(_args: LoaderFunctionArgs) {
  return Response.json({error: 'Method not allowed'}, {status: 405});
}
