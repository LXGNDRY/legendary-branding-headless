import type {LoaderFunctionArgs} from 'react-router';
import {CacheLong} from '~/lib/cache';
import {SITEMAP_HEADERS, urlEntry, urlsetXml} from '~/lib/sitemap';
import {paginate, sitemapOrigin, sitemapVariables, type SitemapConnection, type SitemapNode} from '~/lib/sitemap-data';

const PRODUCTS_QUERY = `#graphql
  query SitemapProducts($country: CountryCode, $language: LanguageCode, $first: Int!, $after: String)
    @inContext(country: $country, language: $language) {
    products(first: $first, after: $after) {
      nodes { handle images(first: 8) { nodes { url } } }
      pageInfo { hasNextPage endCursor }
    }
  }
` as const;

type ProductNode = SitemapNode & {images: {nodes: {url: string}[]}};

export async function loader({request, context}: LoaderFunctionArgs) {
  const origin = sitemapOrigin(context.env, request);
  const variables = sitemapVariables(100);
  const products = await paginate<ProductNode>(
    async (after) =>
      (await context.storefront.query(PRODUCTS_QUERY, {variables: {...variables, after}, cache: CacheLong()})).products as SitemapConnection<ProductNode>,
  );

  // NOTE: no <lastmod> for products -- Shopify bumps Product.updatedAt on every inventory adjustment (each order), which is not a real content change.
  const entries = products.map((item) =>
    urlEntry(origin, `/products/${item.handle}`, undefined, item.images.nodes.map((image) => image.url)),
  );
  return new Response(urlsetXml(entries), {headers: SITEMAP_HEADERS});
}
