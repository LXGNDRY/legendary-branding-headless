import {createHydrogenContext} from '@shopify/hydrogen';
import {AppSession} from '~/lib/session';

/**
 * Creates all context objects available to route loaders and actions.
 * Called once per request in server.ts.
 *
 * Returns the HydrogenRouterContextProvider instance directly — do NOT spread
 * it into a plain object. React Router v7 with v8_middleware requires the
 * context passed to handleRequest to be a RouterContextProvider instance.
 */
export async function createAppLoadContext(
  request: Request,
  env: Env,
  executionContext: ExecutionContext,
) {
  if (!env.SESSION_SECRET) {
    throw new Error('SESSION_SECRET environment variable is not set');
  }
  if (!env.PUBLIC_STORE_DOMAIN) {
    throw new Error('PUBLIC_STORE_DOMAIN environment variable is not set');
  }
  if (!env.PUBLIC_STOREFRONT_API_TOKEN) {
    throw new Error('PUBLIC_STOREFRONT_API_TOKEN environment variable is not set');
  }

  const waitUntil = executionContext.waitUntil.bind(executionContext);

  const [cache, session] = await Promise.all([
    caches.open('hydrogen'),
    AppSession.init(request, [env.SESSION_SECRET]),
  ]);

  // Read currency from URL param or session
  const url = new URL(request.url);
  const currencyParam = url.searchParams.get('currency');
  const storedCurrency = session.get('currency');
  const activeCurrency = currencyParam ?? storedCurrency ?? 'USD';

  // If URL param is set, update the session
  if (currencyParam && currencyParam !== storedCurrency) {
    session.set('currency', currencyParam);
  }

  // Configure customer account if env vars are present
  const hasCustomerAccount = Boolean(
    env.PUBLIC_CUSTOMER_ACCOUNT_API_CLIENT_ID,
  );

  return createHydrogenContext({
    env,
    request,
    cache,
    waitUntil,
    session,
    i18n: {language: 'EN', country: 'US', currency: activeCurrency},
    // Customer Account API is only active when the client ID is configured
    ...(hasCustomerAccount && {
      customerAccount: {
        authUrl: '/account/authorize',
      },
    }),
  });
}

export type AppLoadContext = Awaited<ReturnType<typeof createAppLoadContext>>;
