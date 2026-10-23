import type {ServerBuild} from 'react-router';
import * as build from 'virtual:react-router/server-build';
import {createRequestHandler, storefrontRedirect} from '@shopify/hydrogen';
import {createAppLoadContext} from '~/lib/context';
import {applySecurityHeaders, isAssetRequest} from '~/lib/security';
import {withDefaultCacheControl} from '~/lib/cache';
import {applyPrivateHeaders} from '~/lib/private-route';
import {applyHostRobotsHeader} from '~/lib/robots';
import {appendPendingSessionCookie, copySetCookies} from '~/lib/response-cookies';
import {initSentryServer, captureServerError, drainServerReports} from '~/lib/sentry.server';
import {setServerErrorReporter} from '~/lib/monitoring';
import {releaseProbe} from '~/lib/release';

// Route captureError() calls made inside loaders and actions through the redacting server reporter.
// NOTE: no AsyncLocalStorage on Oxygen, so the reporter uses the isolate's latest request for URL and live/preview
// environment. An isolate serves one deployment, so this only mislabels if it serves live and preview hosts at once.
let latestRequest: Request | undefined;
setServerErrorReporter((error, context) => captureServerError(error, {request: latestRequest, extra: context}));

// Mode is determined by import.meta.env.PROD (set by Vite/Rollup at build time).
// On Oxygen production, PROD is always true. On local dev, it's false.
// Never hardcode 'development' — it exposes stack traces in production error responses.
// DO NOT change this to a runtime check (process.env.NODE_ENV etc.) —
// PROD is a compile-time constant that Vite strips dead code branches.

export default {
  async fetch(
    request: Request,
    env: Env,
    ctx: ExecutionContext,
  ): Promise<Response> {
    latestRequest = request;
    try {
      // Sentry — init early so errors during context setup are captured
      initSentryServer(env);

      // NOTE: answered before context construction so a missing variable yields the 503 diagnostic, not a generic 500.
      const probe = releaseProbe(request, env as unknown as Record<string, unknown>, import.meta.env.VITE_RELEASE_SHA);
      if (probe) {
        if (probe.failure) {
          captureServerError(new Error(probe.failure), {request, waitUntil: ctx.waitUntil.bind(ctx)});
          ctx.waitUntil(drainServerReports());
        }
        return applySecurityHeaders(probe.response, request);
      }

      const appContext = await createAppLoadContext(request, env, ctx);

      // NOTE: Hydrogen's handler (not react-router's) is required -- it serves
      // the same-origin Storefront API proxy that consent/analytics depend on.
      // Locale (SEO-07): the URL carries its own locale prefix and routes are
      // registered under every supported prefix in app/routes.ts, so React
      // Router matches `/de/products/foo` directly. The context reads the
      // language from request.url via parseLocalizedPath -- no URL rewrite.
      const handleRequest = createRequestHandler({
        build: build as unknown as ServerBuild,
        mode: import.meta.env.PROD ? 'production' : 'development',
        getLoadContext: () => appContext,
      });

      let response = await handleRequest(request);
      // Reports raised inside route handlers finish delivering after the response is sent.
      ctx.waitUntil(drainServerReports());

      // Commit session cookie if modified
      await appendPendingSessionCookie(response, appContext.session);

      // Apply security headers to all non-asset responses
      if (!isAssetRequest(request)) {
        // NOTE: private routes (account, cart) are uncacheable and unindexable on every response, errors included.
        response = applyHostRobotsHeader(
          applyPrivateHeaders(withDefaultCacheControl(applySecurityHeaders(response, request)), request.url),
          request.url,
        );
      }

      // Handle 404s via Shopify redirects (URL redirects from admin)
      if (response.status === 404) {
        const redirectResponse = await storefrontRedirect({
          request,
          response,
          storefront: appContext.storefront,
        });

        // Keep the session/cart cookies set on the original response
        copySetCookies(response, redirectResponse);

        // Re-apply security headers to the redirect response
        if (redirectResponse !== response && !isAssetRequest(request)) {
          return applyHostRobotsHeader(applyPrivateHeaders(applySecurityHeaders(redirectResponse, request), request.url), request.url);
        }

        return redirectResponse;
      }

      return response;
    } catch (error) {
      // Server-level error — never expose details to the client
      console.error('Server error:', error);

      // Report to Sentry
      captureServerError(error, {request, waitUntil: ctx.waitUntil.bind(ctx)});
      ctx.waitUntil(drainServerReports());

      // In development, include the error message for debugging
      const isDev = !import.meta.env.PROD;
      const errorBody = isDev
        ? `Server error: ${error instanceof Error ? error.message : String(error)}`
        : 'An unexpected error occurred';

      const response = new Response(errorBody, {
        status: 500,
        headers: {
          'Content-Type': 'text/plain; charset=utf-8',
          'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
        },
      });

      return applyHostRobotsHeader(applyPrivateHeaders(applySecurityHeaders(response, request), request.url), request.url);
    }
  },
};
