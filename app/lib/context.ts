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

  const waitUntil = executionContext.waitUntil.bind(executionContext);

  const [cache, session] = await Promise.all([
    caches.open('hydrogen'),
    AppSession.init(request, [env.SESSION_SECRET]),
  ]);

  return createHydrogenContext({
    env,
    request,
    cache,
    waitUntil,
    session,
    i18n: {language: 'EN', country: 'US'},
  });
}

export type AppLoadContext = Awaited<ReturnType<typeof createAppLoadContext>>;
