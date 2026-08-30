import type {ActionFunctionArgs} from 'react-router';
import type {CountryCode} from '@shopify/hydrogen/storefront-api-types';
import {
  isAvailableCountry,
  LOCALIZATION_QUERY,
  normalizeCountryCode,
  type LocalizationData,
} from '~/lib/market';
import {requireSameOrigin} from '~/lib/security';

export async function action({request, context}: ActionFunctionArgs) {
  if (request.method !== 'POST') {
    return Response.json({error: 'Method not allowed'}, {status: 405});
  }
  const originError = requireSameOrigin(request);
  if (originError) return originError;

  const formData = await request.formData();
  const country = normalizeCountryCode(formData.get('country'));
  if (!country) {
    return Response.json({error: 'Invalid country'}, {status: 400});
  }

  const result = await context.storefront.query(LOCALIZATION_QUERY, {
    variables: {
      country: context.storefront.i18n.country,
      language: context.storefront.i18n.language,
    },
  });
  const localization = result.localization as LocalizationData | undefined;

  if (!localization || !isAvailableCountry(country, localization.availableCountries)) {
    return Response.json({error: 'Country is not available for this storefront'}, {status: 400});
  }

  context.session.set('country', country);

  let cart = null;
  const cartId = await context.cart.getCartId();
  if (cartId) {
    const updated = await context.cart.updateBuyerIdentity({
      countryCode: country as CountryCode,
    });
    cart = updated.cart;
  }

  return Response.json({success: true, country, cart});
}
