import type {LoaderFunctionArgs} from 'react-router';
import {SITEMAP_HEADERS, sitemapIndexXml} from '~/lib/sitemap';
import {sitemapOrigin} from '~/lib/sitemap-data';

// NOTE: an index of per-type sitemaps so Search Console reports indexing for products, collections, pages and the journal separately.
export function loader({request, context}: LoaderFunctionArgs) {
  const origin = sitemapOrigin(context.env, request);
  return new Response(
    sitemapIndexXml(origin, ['/sitemap-pages.xml', '/sitemap-collections.xml', '/sitemap-products.xml', '/sitemap-journal.xml']),
    {headers: SITEMAP_HEADERS},
  );
}
