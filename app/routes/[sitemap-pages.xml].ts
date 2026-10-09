import type {LoaderFunctionArgs} from 'react-router';
import {CacheLong} from '~/lib/cache';
import {canonicalPagePath} from '~/lib/page-routes';
import {SITEMAP_HEADERS, urlEntry, urlsetXml} from '~/lib/sitemap';
import {paginate, sitemapOrigin, sitemapVariables, type SitemapConnection} from '~/lib/sitemap-data';

const PAGES_QUERY = `#graphql
  query SitemapPages($country: CountryCode, $language: LanguageCode, $first: Int!, $after: String)
    @inContext(country: $country, language: $language) {
    pages(first: $first, after: $after) { nodes { handle updatedAt } pageInfo { hasNextPage endCursor } }
  }
` as const;

export async function loader({request, context}: LoaderFunctionArgs) {
  const origin = sitemapOrigin(context.env, request);
  const variables = sitemapVariables(250);
  const pages = await paginate(
    async (after) =>
      (await context.storefront.query(PAGES_QUERY, {variables: {...variables, after}, cache: CacheLong()})).pages as SitemapConnection,
  );

  // NOTE: each page is listed once, under the URL its canonical points to (see canonicalPagePath).
  const entries = [
    urlEntry(origin, '/'),
    urlEntry(origin, '/collections'),
    urlEntry(origin, '/journal'),
    ...pages.map((item) => urlEntry(origin, canonicalPagePath(item.handle), item.updatedAt)),
  ];
  return new Response(urlsetXml(entries), {headers: SITEMAP_HEADERS});
}
