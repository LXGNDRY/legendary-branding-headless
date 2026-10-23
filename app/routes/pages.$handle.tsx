import SafeHtml from '~/components/ui/SafeHtml';
import {
  redirect,
  type LoaderFunctionArgs,
  type MetaFunction,
  useLoaderData,
} from 'react-router';
import Container from '~/components/ui/Container';
import ContentBlocks from '~/components/sections/ContentBlocks';
import {parseContentBlocks} from '~/lib/content-blocks';
import {CacheLong} from '~/lib/cache';
import JsonLd from '~/components/ui/JsonLd';
import {breadcrumbSchema} from '~/components/seo/SeoSchema';
import {ROUTES, canonicalLocaleUrl, isPolicyHandle} from '~/lib/site';

const PAGE_QUERY = `#graphql
  query Page($handle: String!, $country: CountryCode, $language: LanguageCode)
    @inContext(country: $country, language: $language) {
    page(handle: $handle) {
      id
      title
      body
      metafield(namespace: "custom", key: "content_blocks") {
        value
      }
    }
  }
` as const;

interface PageData {
  id: string;
  title: string;
  body: string;
  metafield?: {value: string} | null;
}

export const meta: MetaFunction<typeof loader> = ({data, params, matches}) => {
  const title = `${data?.page?.title ?? 'Page'} | LEGENDARY BRANDING`;
  const canonical = canonicalLocaleUrl(ROUTES.page(params.handle ?? ''), matches);

  return [
    {title},
    {name: 'description', content: data?.page?.body?.replace(/<[^>]+>/g, '').slice(0, 160) ?? 'Legendary Branding.'},
    {tagName: 'link', rel: 'canonical', href: canonical},
    {property: 'og:title', content: title},
    {property: 'og:url', content: canonical},
  ];
};

export async function loader({params, context}: LoaderFunctionArgs) {
  const handle = params.handle ?? '';
  if (!handle) throw new Response('Not Found', {status: 404});
  // NOTE: policy handles have one canonical home; an old /pages link to one still works through a permanent redirect.
  if (isPolicyHandle(handle)) throw redirect(ROUTES.policy(handle), 301);

  const {page} = await context.storefront.query(PAGE_QUERY, {
    variables: {
      handle,
      country: context.storefront.i18n.country,
      language: context.storefront.i18n.language,
    },
    cache: CacheLong(),
  });

  if (!page) throw new Response('Page not found', {status: 404});

  const contentBlocks = parseContentBlocks(page.metafield?.value);

  return {
    page: page as PageData,
    contentBlocks,
  };
}

export default function PageRoute() {
  const {page, contentBlocks} = useLoaderData<typeof loader>();

  const breadcrumbJsonLd = breadcrumbSchema([
    {name: 'Home', url: '/'},
    {name: page.title},
  ]);

  return (
    <Container className="py-16">
      <JsonLd data={breadcrumbJsonLd} />
      <div className="max-w-4xl mx-auto">
        {/* Title */}
        <header className="mb-12 text-center">
          <div className="h-eyebrow mb-4">LEGENDARY BRANDING</div>
          <h1 className="text-4xl md:text-5xl font-normal tracking-tight">
            {page.title}
          </h1>
        </header>

        {/* Content blocks (metafield-driven) */}
        {contentBlocks.length > 0 ? (
          <ContentBlocks blocks={contentBlocks} />
        ) : (
          // Fallback to body HTML
          page.body && (
            <SafeHtml className="prose prose-sm max-w-none text-[var(--color-text-primary)] [&_p]:text-sm [&_p]:leading-relaxed [&_p]:text-[var(--color-text-primary)] [&_h2]:text-2xl [&_h3]:text-xl [&_li]:my-0.5" html={page.body} />
          )
        )}
      </div>
    </Container>
  );
}