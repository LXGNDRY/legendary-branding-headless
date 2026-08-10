import {
  createRequestHandler,
  type RouterContextProvider,
  type ServerBuild,
} from 'react-router';
import * as build from 'virtual:react-router/server-build';
import {storefrontRedirect} from '@shopify/hydrogen';
import {createAppLoadContext} from '~/lib/context';

export default {
  async fetch(
    request: Request,
    env: Env,
    ctx: ExecutionContext,
  ): Promise<Response> {
    try {
      const appContext = await createAppLoadContext(request, env, ctx);

      // TODO: remove 'development' before final production deploy
      const handleRequest = createRequestHandler(build as unknown as ServerBuild, 'development');

      const response = await handleRequest(
        request,
        appContext as unknown as RouterContextProvider,
      );

      if (appContext.session.isPending) {
        response.headers.set(
          'Set-Cookie',
          await appContext.session.commit(),
        );
      }

      if (response.status === 404) {
        return storefrontRedirect({
          request,
          response,
          storefront: appContext.storefront,
        });
      }

      return response;
    } catch (error) {
      console.error(error);
      return new Response('An unexpected error occurred', {status: 500});
    }
  },
};
