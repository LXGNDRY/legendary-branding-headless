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
import {enforceRatePolicy} from '~/lib/rate-limit';
import {captureError} from '~/lib/monitoring';
import {localizePath, parseLocalizedPath, toSupportedLanguage} from '~/lib/locale';

export async function action({request, context}: ActionFunctionArgs) {
  if (request.method !== 'POST') {
    return Response.json({error: 'Method not allowed'}, {status: 405});
  }
  const originError = requireSameOrigin(request);
  if (originError) return originError;
  const limited = enforceRatePolicy(request, 'market');
  if (limited) return limited;

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return Response.json({error: 'Invalid request'}, {status: 400});
  }
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

  // Update the cart's buyer identity FIRST. If Shopify rejects it, the shopper
  // keeps their previous market (session and cart stay consistent) and sees an
  // error instead of a half-applied switch.
  const headers = new Headers();
  let cart = null;
  const cartId = await context.cart.getCartId();
  if (cartId) {
    try {
      const updated = await context.cart.updateBuyerIdentity({countryCode: country as CountryCode});
      if (!updated?.cart) {
        // NOTE: the saved cart ID no longer resolves (expired or deleted). Drop the unusable
        // cookie and apply the selection; otherwise the shopper could never change market.
        headers.append('Set-Cookie', 'cart=; Path=/; Max-Age=0; SameSite=Lax');
      } else if (updated.errors?.length) {
        throw new Error('Cart buyer identity update was rejected');
      } else {
        cart = updated.cart;
        // The cart ID can rotate when the market changes; persist whatever Shopify returned.
        for (const cookie of context.cart.setCartId(updated.cart.id).getSetCookie()) {
          headers.append('Set-Cookie', cookie);
        }
      }
    } catch (error) {
      captureError(error, {route: 'api.market', failure: 'buyer-identity'});
      return Response.json(
        {error: 'We could not switch your cart to that country. Your previous selection was kept.'},
        {status: 409},
      );
    }
  }

  context.session.set('country', country);
  context.session.set('language', language);

  // The selected market must survive navigation. Without committing this
  // cookie, the next server render falls back to edge detection and can show
  // a different Markets price/currency than the one the customer selected.
  headers.append('Set-Cookie', await context.session.commit());

  // SEO-07: compute the equivalent locale URL for the page the shopper came
  // from so the client-side can navigate to /de/products/foo instead of
  // reloading /products/foo (which would render in EN and drop the choice
  // Google indexed). Falls back to the home URL for the selected language.
  const target = toSupportedLanguage(language);
  let redirectTo: string | null = null;
  if (target) {
    try {
      const referer = request.headers.get('referer');
      const originUrl = new URL(request.url);
      const refererUrl = referer ? new URL(referer) : null;
      const samePathname =
        refererUrl && refererUrl.origin === originUrl.origin ? refererUrl.pathname : '/';
      const {path: bare} = parseLocalizedPath(samePathname);
      redirectTo = localizePath(bare, target);
    } catch {
      redirectTo = localizePath('/', target);
    }
  }

  return Response.json({success: true, country, language, cart, redirectTo}, {headers});
}
