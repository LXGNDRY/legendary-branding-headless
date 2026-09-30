import type {LoaderFunctionArgs} from 'react-router';

/**
 * robots.txt — resource route.
 *
 * Generates a robots.txt with sitemap link.
 * Blocks checkout and account routes, allows everything else.
 * Uses PUBLIC_CHECKOUT_DOMAIN when available so the Sitemap URL always points
 * to the canonical domain rather than the Oxygen preview origin (consistent
 * with [sitemap.xml].tsx). PUBLIC_CHECKOUT_DOMAIN is documented/configured
 * as the bare apex (legendary-branding.com), which 301-redirects to the
 * live www host that every canonical <link>/og:url now points at -- www is
 * prefixed here so this Sitemap line stays on that same host instead of
 * silently reverting to the redirecting apex host whenever the var is set.
 */
export async function loader({request, context}: LoaderFunctionArgs) {
  const env = context.env as {PUBLIC_CHECKOUT_DOMAIN?: string};
  const domain = env.PUBLIC_CHECKOUT_DOMAIN?.trim().replace(/^www\./, '');
  const origin = domain ? `https://www.${domain}` : new URL(request.url).origin;

  const robots = `User-agent: *
Allow: /

# Block account pages (noindex)
Disallow: /account/
Disallow: /checkout/
Disallow: /cart/
Disallow: /search/
Disallow: /apis/
Disallow: /api/
Disallow: /docs/

# Sitemap
Sitemap: ${origin}/sitemap.xml
`;

  return new Response(robots, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, max-age=86400, stale-while-revalidate=604800',
    },
  });
}
