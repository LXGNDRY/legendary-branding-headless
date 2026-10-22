import type {LoaderFunctionArgs} from 'react-router';
import {buildRobotsTxt, isIndexableHost} from '~/lib/robots';
import {SITE_ORIGIN} from '~/lib/site';

/**
 * robots.txt — resource route (rules live in ~/lib/robots).
 *
 * The Sitemap line always uses the canonical public origin (~/lib/site), never the request host or the
 * checkout domain, so a preview or the raw Oxygen URL still points crawlers at the live sitemap.
 *
 * Oxygen deployment hosts (*.myshopify.dev) get a block-everything file.
 */
export async function loader({request}: LoaderFunctionArgs) {
  const url = new URL(request.url);

  return new Response(buildRobotsTxt({origin: SITE_ORIGIN, indexable: isIndexableHost(url.host)}), {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, max-age=3600, stale-while-revalidate=86400',
    },
  });
}
