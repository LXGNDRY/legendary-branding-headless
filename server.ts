import {
  createRequestHandler,
  type RouterContextProvider,
  type ServerBuild,
} from 'react-router';
import * as build from 'virtual:react-router/server-build';
import {storefrontRedirect} from '@shopify/hydrogen';
import {createAppLoadContext} from '~/lib/context';
import {applySecurityHeaders, isAssetRequest} from '~/lib/security';
import {initSentryServer, captureServerError} from '~/lib/sentry.server';

const handleRequest = createRequestHandler(
  build as unknown as ServerBuild,
  import.meta.env.PROD ? 'production' : 'development',
);

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
    try {
      // Sentry — init early so errors during context setup are captured
      initSentryServer(env);

      const appContext = await createAppLoadContext(request, env, ctx);

      let response = await handleRequest(
        request,
        appContext as unknown as RouterContextProvider,
      );

      // Commit session cookie if modified
      if (appContext.session.isPending) {
        response.headers.set(
          'Set-Cookie',
          await appContext.session.commit(),
        );
      }

      // Apply security headers to all non-asset responses
      if (!isAssetRequest(request)) {
        response = applySecurityHeaders(response, request);
      }

      // Handle 404s via Shopify redirects (URL redirects from admin)
      if (response.status === 404) {
        const redirectResponse = await storefrontRedirect({
          request,
          response,
          storefront: appContext.storefront,
        });

        // Re-apply security headers to the redirect response
        if (redirectResponse !== response && !isAssetRequest(request)) {
          return applySecurityHeaders(redirectResponse, request);
        }

        return redirectResponse;
      }

      return response;
    } catch (error) {
      // Server-level error — never expose details to the client
      console.error('Server error:', error);

      // Report to Sentry
      captureServerError(error, {request});

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

      return applySecurityHeaders(response, request);
    }
  },
};
