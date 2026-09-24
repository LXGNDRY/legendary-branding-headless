import type {ActionFunctionArgs} from 'react-router';
import type {CountryCode} from '@shopify/hydrogen/storefront-api-types';
import {
  isAvailableCountry,
  isAvailableLanguage,
  LOCALIZATION_QUERY,
  normalizeCountryCode,
  normalizeLanguageCode,
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
  const language = normalizeLanguageCode(formData.get('language'));
  if (!country) {
    return Response.json({error: 'Invalid country'}, {status: 400});
  }
  if (!language) {
    return Response.json({error: 'Invalid language'}, {status: 400});
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
  if (!isAvailableLanguage(language, localization.availableLanguages)) {
    return Response.json({error: 'Language is not available for this storefront'}, {status: 400});
  }

  context.session.set('country', country);
  context.session.set('language', language);

  let cart = null;
  const cartId = await context.cart.getCartId();
  if (cartId) {
    const updated = await context.cart.updateBuyerIdentity({
      countryCode: country as CountryCode,
    });
    cart = updated.cart;
  }

  // The selected market must survive navigation. Without committing this
  // cookie, the next server render falls back to edge detection and can show
  // a different Markets price/currency than the one the customer selected.
  const headers = new Headers();
  if (context.session.isPending) {
    headers.set('Set-Cookie', await context.session.commit());
  }

  return Response.json({success: true, country, language, cart}, {headers});
}
