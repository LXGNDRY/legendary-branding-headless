import type {LoaderFunctionArgs} from 'react-router';
import {buildRobotsTxt, isIndexableHost} from '~/lib/robots';

/**
 * robots.txt — resource route (rules live in ~/lib/robots).
 *
 * Uses PUBLIC_CHECKOUT_DOMAIN when available so the Sitemap URL always points
 * to the canonical domain rather than the Oxygen preview origin (consistent
 * with [sitemap.xml].tsx). PUBLIC_CHECKOUT_DOMAIN is documented/configured
 * as the bare apex (legendary-branding.com), which 301-redirects to the
 * live www host that every canonical <link>/og:url now points at -- www is
 * prefixed here so this Sitemap line stays on that same host instead of
 * silently reverting to the redirecting apex host whenever the var is set.
 *
 * Oxygen deployment hosts (*.myshopify.dev) get a block-everything file.
 */
export async function loader({request, context}: LoaderFunctionArgs) {
  const env = context.env as {PUBLIC_CHECKOUT_DOMAIN?: string};
  const domain = env.PUBLIC_CHECKOUT_DOMAIN?.trim().replace(/^www\./, '');
  const url = new URL(request.url);
  const origin = domain ? `https://www.${domain}` : url.origin;

  return new Response(buildRobotsTxt({origin, indexable: isIndexableHost(url.host)}), {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, max-age=3600, stale-while-revalidate=86400',
    },
  });
}
