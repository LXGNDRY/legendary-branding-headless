import type {LoaderFunctionArgs} from 'react-router';

/**
 * robots.txt — resource route.
 *
 * Generates a robots.txt with sitemap link.
 * Blocks checkout and account routes, allows everything else.
 * Uses PUBLIC_CHECKOUT_DOMAIN when available so the Sitemap URL always points
 * to the canonical domain rather than the Oxygen preview origin (consistent
 * with [sitemap.xml].tsx).
 */
export async function loader({request, context}: LoaderFunctionArgs) {
  const env = context.env as {PUBLIC_CHECKOUT_DOMAIN?: string};
  const origin = env.PUBLIC_CHECKOUT_DOMAIN
    ? `https://${env.PUBLIC_CHECKOUT_DOMAIN}`
    : new URL(request.url).origin;

  const robots = `User-agent: *
Allow: /

# Block account pages (noindex)
Disallow: /account/
Disallow: /checkout/
Disallow: /cart/
Disallow: /search/
Disallow: /apis/

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
