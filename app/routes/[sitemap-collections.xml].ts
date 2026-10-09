import type {LoaderFunctionArgs} from 'react-router';
import {CacheLong} from '~/lib/cache';
import {SITEMAP_HEADERS, urlEntry, urlsetXml} from '~/lib/sitemap';
import {paginate, sitemapOrigin, sitemapVariables, type SitemapConnection, type SitemapNode} from '~/lib/sitemap-data';

const COLLECTIONS_QUERY = `#graphql
  query SitemapCollections($country: CountryCode, $language: LanguageCode, $first: Int!, $after: String)
    @inContext(country: $country, language: $language) {
    collections(first: $first, after: $after) {
      nodes { handle products(first: 1) { nodes { id } } }
      pageInfo { hasNextPage endCursor }
    }
  }
` as const;

type CollectionNode = SitemapNode & {products: {nodes: {id: string}[]}};

export async function loader({request, context}: LoaderFunctionArgs) {
  const origin = sitemapOrigin(context.env, request);
  const variables = sitemapVariables(250);
  const collections = await paginate<CollectionNode>(
    async (after) =>
      (await context.storefront.query(COLLECTIONS_QUERY, {variables: {...variables, after}, cache: CacheLong()})).collections as SitemapConnection<CollectionNode>,
  );

  // NOTE: no <lastmod> -- Collection.updatedAt moves whenever membership is recomputed (several times a day on the automatic collections), so it does not mark a content change. Empty collections are thin pages and stay out.
  const entries = collections
    .filter((item) => item.products.nodes.length > 0)
    .map((item) => urlEntry(origin, `/collections/${item.handle}`));
  return new Response(urlsetXml(entries), {headers: SITEMAP_HEADERS});
}
