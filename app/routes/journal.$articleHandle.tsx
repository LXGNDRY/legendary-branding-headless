import type {MetaFunction, LoaderFunctionArgs} from 'react-router';
import {useLoaderData, Link} from 'react-router';
import {Image} from '@shopify/hydrogen';
import Container from '~/components/ui/Container';
import {CacheLong} from '~/lib/cache';
import JsonLd from '~/components/ui/JsonLd';
import {articleSchema, breadcrumbSchema} from '~/components/seo/SeoSchema';

type ArticleData = {
  id: string;
  title: string;
  handle: string;
  publishedAt: string;
  contentHtml: string;
  excerpt?: string | null;
  tags: string[];
  image?: {
    url: string;
    altText?: string | null;
    width?: number | null;
    height?: number | null;
  } | null;
  author?: {name: string; bio?: string | null} | null;
  blog: {title: string; handle: string};
};

const ARTICLE_QUERY = `#graphql
  query Article(
    $blogHandle: String!
    $articleHandle: String!
    $country: CountryCode
    $language: LanguageCode
  ) @inContext(country: $country, language: $language) {
    blog(handle: $blogHandle) {
      articleByHandle(handle: $articleHandle) {
        id
        title
        handle
        publishedAt
        contentHtml
        excerpt
        tags
        image { url altText width height }
        author: authorV2 { name bio }
        blog { title handle }
      }
    }
  }
` as const;

export const meta: MetaFunction<typeof loader> = ({data, location}) => {
  const article = data?.article;
  const description = article?.excerpt ?? `${article?.title ?? 'Article'} — Legendary Branding Journal`;
  const ogImage = article?.image?.url;
  const canonical = `https://legendary-branding.com${location.pathname}`;
  return [
    {title: `${article?.title ?? 'Article'} — The Journal — LEGENDARY BRANDING`},
    {name: 'description', content: description},
    {tagName: 'link', rel: 'canonical', href: canonical},
    {property: 'og:type', content: 'article'},
    {property: 'og:title', content: article?.title ?? 'Article'},
    {property: 'og:description', content: description},
    {property: 'og:url', content: canonical},
    ...(ogImage ? [{property: 'og:image', content: `${ogImage}&width=1200&height=630`}] : []),
    {name: 'twitter:card', content: 'summary_large_image'},
    {name: 'twitter:title', content: article?.title ?? 'Article'},
    {name: 'twitter:description', content: description},
    ...(ogImage ? [{name: 'twitter:image', content: `${ogImage}&width=1200&height=630`}] : []),
  ];
};

export async function loader({params, context}: LoaderFunctionArgs) {
  const {articleHandle} = params;
  if (!articleHandle) throw new Response('Not Found', {status: 404});

  const {blog} = await context.storefront.query(ARTICLE_QUERY, {
    variables: {
      articleHandle,
      blogHandle: 'legendary_blogging',
      country: context.storefront.i18n.country,
      language: context.storefront.i18n.language,
    },
    cache: CacheLong(),
  });

  const article = blog?.articleByHandle;
  if (!article) throw new Response('Article not found', {status: 404});

  return {article: article as ArticleData};
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

export default function ArticlePage() {
  const {article} = useLoaderData<typeof loader>();

  const articleJsonLd = articleSchema({
    title: article.title,
    handle: article.handle,
    datePublished: article.publishedAt,
    description: article.excerpt ?? '',
    imageUrl: article.image?.url,
    authorName: article.author?.name,
  });

  const breadcrumbJsonLd = breadcrumbSchema([
    {name: 'Journal', url: '/journal'},
    {name: article.title},
  ]);

  return (
    <article>
      <JsonLd data={articleJsonLd} />
      <JsonLd data={breadcrumbJsonLd} />
      {/* Hero image */}
      {article.image && (
        <div className="w-full overflow-hidden bg-[#f7f7f7] max-h-[70vh]">
          <Image
            data={article.image}
            aspectRatio="16/7"
            width={1600}
            height={700}
            sizes="100vw"
            loading="eager"
            className="w-full object-cover"
          />
        </div>
      )}

      <Container className="py-14">
        {/* Breadcrumb + header */}
        <header className="max-w-2xl mx-auto mb-12">
          <nav
            className="mb-6 text-[11px] tracking-widest uppercase text-[#6b6b6b]"
            aria-label="Breadcrumb"
          >
            <Link to="/journal" className="hover:text-[#0a0a0a] transition-colors">
              Journal
            </Link>
            <span className="mx-2">/</span>
            <span className="text-[#0a0a0a] line-clamp-1">{article.title}</span>
          </nav>

          <h1 className="text-3xl sm:text-5xl font-bold tracking-tight leading-tight mb-6">
            {article.title}
          </h1>

          <div className="flex items-center gap-4 text-[11px] text-[#999999] tracking-wide">
            <span>{formatDate(article.publishedAt)}</span>
            {article.author?.name && (
              <>
                <span>·</span>
                <span>By {article.author.name}</span>
              </>
            )}
          </div>

          {article.excerpt && (
            <p className="mt-6 text-base text-[#6b6b6b] leading-relaxed border-l-2 border-[#e5e5e5] pl-4">
              {article.excerpt}
            </p>
          )}
        </header>

        {/* Article body */}
        <div
          className="max-w-2xl mx-auto prose prose-sm lg:prose-base max-w-none
            [&_p]:text-[#0a0a0a] [&_p]:leading-relaxed [&_p]:mb-5
            [&_h2]:text-xl [&_h2]:font-bold [&_h2]:tracking-tight [&_h2]:mt-10 [&_h2]:mb-4
            [&_h3]:text-lg [&_h3]:font-bold [&_h3]:tracking-tight [&_h3]:mt-8 [&_h3]:mb-3
            [&_ul]:pl-5 [&_ul]:mb-5 [&_li]:mb-1 [&_li]:text-[#0a0a0a]
            [&_ol]:pl-5 [&_ol]:mb-5
            [&_strong]:font-semibold [&_strong]:text-[#0a0a0a]
            [&_a]:underline [&_a]:underline-offset-2 [&_a]:text-[#0a0a0a] [&_a]:hover:text-[#6b6b6b]
            [&_blockquote]:border-l-2 [&_blockquote]:border-[#0a0a0a] [&_blockquote]:pl-4 [&_blockquote]:italic [&_blockquote]:text-[#6b6b6b]
            [&_img]:w-full [&_img]:my-8"
          // eslint-disable-next-line react/no-danger
          dangerouslySetInnerHTML={{__html: article.contentHtml}}
        />

        {/* Tags */}
        {article.tags.length > 0 && (
          <div className="max-w-2xl mx-auto mt-12 pt-8 border-t border-[#e5e5e5]">
            <div className="flex flex-wrap gap-2">
              {article.tags.map((tag) => (
                <span
                  key={tag}
                  className="text-[10px] tracking-widest uppercase border border-[#e5e5e5] px-3 py-1.5 text-[#6b6b6b]"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Back link */}
        <div className="max-w-2xl mx-auto mt-12">
          <Link
            to="/journal"
            className="text-xs font-semibold tracking-widest uppercase border-b border-[#0a0a0a] pb-0.5 hover:border-[#6b6b6b] hover:text-[#6b6b6b] transition-colors"
          >
            ← Back to Journal
          </Link>
        </div>
      </Container>
    </article>
  );
}
