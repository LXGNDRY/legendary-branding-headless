import type {LoaderFunctionArgs} from 'react-router';
import {CacheLong} from '~/lib/cache';
import {SITEMAP_HEADERS, urlEntry, urlsetXml} from '~/lib/sitemap';
import {paginate, sitemapOrigin, type SitemapConnection} from '~/lib/sitemap-data';

const ARTICLES_QUERY = `#graphql
  query SitemapArticles($blogHandle: String!, $country: CountryCode, $language: LanguageCode, $first: Int!, $after: String)
    @inContext(country: $country, language: $language) {
    blog(handle: $blogHandle) {
      articles(first: $first, after: $after) { nodes { handle updatedAt: publishedAt } pageInfo { hasNextPage endCursor } }
    }
  }
` as const;

export async function loader({request, context}: LoaderFunctionArgs) {
  const origin = sitemapOrigin(context.env, request);
  const variables = {country: context.storefront.i18n.country, language: context.storefront.i18n.language, first: 250};
  const articles = await paginate(
    async (after) =>
      (await context.storefront.query(ARTICLES_QUERY, {variables: {...variables, after, blogHandle: 'legendary_blogging'}, cache: CacheLong()})).blog
        ?.articles as SitemapConnection | undefined,
  );

  const entries = articles.map((item) => urlEntry(origin, `/journal/${item.handle}`, item.updatedAt));
  return new Response(urlsetXml(entries), {headers: SITEMAP_HEADERS});
}
