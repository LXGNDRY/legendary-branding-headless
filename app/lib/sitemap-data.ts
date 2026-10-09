import type {AppLoadContext} from 'react-router';
import {DEFAULT_COUNTRY, DEFAULT_LANGUAGE} from '~/lib/market';

export type SitemapNode = {handle: string; updatedAt?: string};
export type SitemapConnection<T extends SitemapNode = SitemapNode> = {
  nodes: T[];
  pageInfo: {hasNextPage: boolean; endCursor?: string | null};
};

/** Reads every page of a Storefront connection (bounded) so a growing catalog never silently truncates. */
export async function paginate<T extends SitemapNode>(
  queryPage: (after: string | null) => Promise<SitemapConnection<T> | null | undefined>,
) {
  const nodes: T[] = [];
  let after: string | null = null;
  for (let page = 0; page < 100; page += 1) {
    const connection = await queryPage(after);
    if (!connection) break;
    nodes.push(...connection.nodes);
    if (!connection.pageInfo.hasNextPage || !connection.pageInfo.endCursor) break;
    after = connection.pageInfo.endCursor;
  }
  return nodes;
}

/**
 * PUBLIC_CHECKOUT_DOMAIN is documented/configured as the bare apex
 * (legendary-branding.com), but the live site is actually served from and
 * canonicalizes to the www subdomain (the apex 301-redirects there -- see the
 * canonical <link>/og:url fixes across the rest of the app). Prefixing www here
 * keeps every sitemap <loc> on the same host as those canonical tags.
 */
export function sitemapOrigin(env: AppLoadContext['env'], request: Request) {
  const domain = env.PUBLIC_CHECKOUT_DOMAIN?.trim().replace(/^www\./, '');
  return domain ? `https://www.${domain}` : new URL(request.url).origin;
}

/**
 * Storefront variables for a sitemap query. Pinned to the default market, not
 * the visitor's: `@inContext(country:)` hides products not published there, so
 * a request-derived market would give crawlers in different countries different
 * sitemaps.
 */
export function sitemapVariables(first: number) {
  return {country: DEFAULT_COUNTRY, language: DEFAULT_LANGUAGE, first};
}
