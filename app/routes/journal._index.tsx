import type {MetaFunction, LoaderFunctionArgs} from 'react-router';
import {useLoaderData, Link} from 'react-router';
import {Image} from '@shopify/hydrogen';
import Container from '~/components/ui/Container';
import {CacheLong} from '~/lib/cache';

type ArticleNode = {
  id: string;
  title: string;
  handle: string;
  publishedAt: string;
  excerpt?: string | null;
  image?: {
    url: string;
    altText?: string | null;
    width?: number | null;
    height?: number | null;
  } | null;
  author?: {name: string} | null;
};

const BLOG_QUERY = `#graphql
  query Blog(
    $blogHandle: String!
    $country: CountryCode
    $language: LanguageCode
    $first: Int!
  ) @inContext(country: $country, language: $language) {
    blog(handle: $blogHandle) {
      title
      articles(first: $first, sortKey: PUBLISHED_AT, reverse: true) {
        nodes {
          id
          title
          handle
          publishedAt
          excerpt
          image { url altText width height }
          author: authorV2 { name }
        }
      }
    }
  }
` as const;

export const meta: MetaFunction = () => [
  {title: 'Journal — LEGENDARY BRANDING'},
  {
    name: 'description',
    content: 'Culture, craft, and community from Legendary Branding.',
  },
  {tagName: 'link', rel: 'canonical', href: 'https://legendary-branding.com/journal'},
];

export async function loader({context}: LoaderFunctionArgs) {
  const {blog} = await context.storefront.query(BLOG_QUERY, {
    variables: {
      blogHandle: 'legendary_blogging',
      first: 12,
      country: context.storefront.i18n.country,
      language: context.storefront.i18n.language,
    },
    cache: CacheLong(),
  });

  return {articles: (blog?.articles?.nodes ?? []) as ArticleNode[]};
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

export default function JournalIndex() {
  const {articles} = useLoaderData<typeof loader>();
  const [featured, ...rest] = articles;

  return (
    <Container className="py-16">
      <div className="mb-14 max-w-lg">
        <p className="text-[10px] font-semibold tracking-widest uppercase text-[#6b6b6b] mb-2">
          Editorial
        </p>
        <h1 className="text-4xl sm:text-5xl font-bold tracking-tight">
          The Journal
        </h1>
        <p className="mt-4 text-sm text-[#6b6b6b] leading-relaxed">
          Culture. Craft. Community.
        </p>
      </div>

      {/* Featured article */}
      {featured && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-14 pb-14 border-b border-[#e5e5e5]">
          <Link to={`/journal/${featured.handle}`} prefetch="intent" className="group block overflow-hidden bg-[#f7f7f7]">
            {featured.image ? (
              <Image
                data={featured.image}
                aspectRatio="4/3"
                sizes="(min-width: 768px) 50vw, 100vw"
                loading="eager"
                className="w-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
            ) : (
              <div className="aspect-[4/3] bg-[#e5e5e5]" />
            )}
          </Link>
          <div className="flex flex-col justify-center">
            <span className="text-[10px] font-semibold tracking-widest uppercase text-[#6b6b6b] mb-3">
              Featured
            </span>
            <Link to={`/journal/${featured.handle}`} prefetch="intent" className="group">
              <h2 className="text-2xl sm:text-3xl font-bold tracking-tight mb-4 group-hover:text-[#6b6b6b] transition-colors leading-tight">
                {featured.title}
              </h2>
            </Link>
            {featured.excerpt && (
              <p className="text-sm text-[#6b6b6b] leading-relaxed mb-4 line-clamp-3">
                {featured.excerpt}
              </p>
            )}
            <p className="text-[11px] text-[#999999] tracking-wide mb-6">
              {formatDate(featured.publishedAt)}
              {featured.author?.name && ` · ${featured.author.name}`}
            </p>
            <Link
              to={`/journal/${featured.handle}`}
              prefetch="intent"
              className="text-xs font-semibold tracking-widest uppercase underline underline-offset-4 hover:text-[#6b6b6b] transition-colors w-fit"
            >
              Read More
            </Link>
          </div>
        </div>
      )}

      {/* Article grid */}
      {rest.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {rest.map((article, i) => (
            <article key={article.id} className="group">
              <Link to={`/journal/${article.handle}`} prefetch="intent" className="block mb-4 overflow-hidden bg-[#f7f7f7]">
                {article.image ? (
                  <Image
                    data={article.image}
                    aspectRatio="3/2"
                    sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                    loading={i < 3 ? 'eager' : 'lazy'}
                    className="w-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                ) : (
                  <div className="aspect-[3/2] bg-[#e5e5e5]" />
                )}
              </Link>
              <p className="text-[11px] text-[#999999] tracking-wide mb-2">
                {formatDate(article.publishedAt)}
              </p>
              <Link to={`/journal/${article.handle}`} prefetch="intent">
                <h3 className="text-sm font-medium leading-snug group-hover:text-[#6b6b6b] transition-colors mb-2">
                  {article.title}
                </h3>
              </Link>
              {article.excerpt && (
                <p className="text-xs text-[#6b6b6b] leading-relaxed line-clamp-2">
                  {article.excerpt}
                </p>
              )}
            </article>
          ))}
        </div>
      )}

      {articles.length === 0 && (
        <div className="py-24 text-center">
          <p className="text-sm text-[#6b6b6b] tracking-wide">No articles yet. Check back soon.</p>
        </div>
      )}
    </Container>
  );
}
