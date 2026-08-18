import {
  type LoaderFunctionArgs,
  type MetaFunction,
  useLoaderData,
} from 'react-router';
import Container from '~/components/ui/Container';
import ContentBlocks from '~/components/sections/ContentBlocks';
import {CacheLong} from '~/lib/cache';
import JsonLd from '~/components/ui/JsonLd';
import {breadcrumbSchema} from '~/components/seo/SeoSchema';

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

interface ContentBlock {
  type: 'heading' | 'rich_text' | 'image_text' | 'quote' | 'cta';
  text?: string;
  image?: string;
  title?: string;
  quote?: string;
  attribution?: string;
  button_text?: string;
  button_link?: string;
  position?: 'left' | 'right';
}

export const meta: MetaFunction<typeof loader> = ({data, params}) => {
  const title = `${data?.page?.title ?? 'Page'} — LEGENDARY BRANDING`;
  const canonical = `https://legendary-branding.com/pages/${params.handle ?? ''}`;

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

  const {page} = await context.storefront.query(PAGE_QUERY, {
    variables: {
      handle,
      country: context.storefront.i18n.country,
      language: context.storefront.i18n.language,
    },
    cache: CacheLong(),
  });

  if (!page) throw new Response('Page not found', {status: 404});

  // Parse content blocks from metafield JSON
  let contentBlocks: ContentBlock[] = [];
  if (page.metafield?.value) {
    try {
      const parsed = JSON.parse(page.metafield.value);
      if (Array.isArray(parsed)) {
        contentBlocks = parsed as ContentBlock[];
      }
    } catch {
      // Invalid JSON — fall back to body only
      contentBlocks = [];
    }
  }

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
          <div className="lb-eyebrow mb-4">LEGENDARY BRANDING</div>
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
            <div
              className="prose prose-sm max-w-none text-black [&_p]:text-sm [&_p]:leading-relaxed [&_p]:text-black/70 [&_h2]:text-2xl [&_h3]:text-xl [&_li]:my-0.5"
              // eslint-disable-next-line react/no-danger
              dangerouslySetInnerHTML={{__html: page.body}}
            />
          )
        )}
      </div>
    </Container>
  );
}