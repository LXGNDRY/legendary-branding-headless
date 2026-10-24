import {type LoaderFunctionArgs, type MetaFunction} from 'react-router';
import {useLoaderData} from 'react-router';
import {LocaleLink as Link} from '~/components/ui/LocaleLink';
import {Image} from '@shopify/hydrogen';
import Container from '~/components/ui/Container';
import Placeholder from '~/components/ui/Placeholder';
import {CacheShort} from '~/lib/cache';
import {fetchAllPages} from '~/lib/pagination';
import JsonLd from '~/components/ui/JsonLd';
import {breadcrumbSchema} from '~/components/seo/SeoSchema';
import {ROUTES, canonicalLocaleUrl} from '~/lib/site';

type CollectionNode = {
  id: string;
  title: string;
  handle: string;
  description: string;
  image?: {
    url: string;
    altText?: string | null;
    width?: number | null;
    height?: number | null;
  } | null;
  products: {nodes: {id: string}[]};
};

const COLLECTIONS_QUERY = `#graphql
  query Collections($country: CountryCode, $language: LanguageCode, $first: Int!, $after: String)
    @inContext(country: $country, language: $language) {
    collections(first: $first, after: $after, sortKey: UPDATED_AT) {
      pageInfo {
        hasNextPage
        endCursor
      }
      nodes {
        id
        title
        handle
        description
        image {
          url
          altText
          width
          height
        }
        products(first: 1) {
          nodes {
            id
          }
        }
      }
    }
  }
` as const;

export const meta: MetaFunction = ({matches}) => {
  const canonical = canonicalLocaleUrl(ROUTES.collections, matches);
  return [
    {title: 'Collections | LEGENDARY BRANDING'},
    {name: 'description', content: 'Shop all Legendary Branding collections.'},
    {tagName: 'link', rel: 'canonical', href: canonical},
    {property: 'og:title', content: 'Collections | LEGENDARY BRANDING'},
    {property: 'og:description', content: 'Shop all Legendary Branding collections.'},
    {property: 'og:url', content: canonical},
  ];
};

export async function loader({context}: LoaderFunctionArgs) {
  const {storefront} = context;
  const nodes = await fetchAllPages<CollectionNode>(async (after) => {
    const {collections} = await storefront.query(COLLECTIONS_QUERY, {
      variables: {
        first: 50,
        after,
        country: storefront.i18n.country,
        language: storefront.i18n.language,
      },
      // NOTE: CacheShort so a newly published collection shows up within minutes.
      cache: CacheShort(),
    });
    return collections as {nodes: CollectionNode[]; pageInfo: {hasNextPage: boolean; endCursor?: string | null}};
  });
  return {collections: {nodes}};
}

export default function CollectionsIndex() {
  const {collections} = useLoaderData<typeof loader>();
  const liveCollections = (collections.nodes as CollectionNode[]).filter(
    (collection) => collection.products.nodes.length > 0,
  );

  const breadcrumbJsonLd = breadcrumbSchema([
    {name: 'Home', url: '/'},
    {name: 'Collections'},
  ]);

  return (
    <div className="bg-[var(--color-bg-level-0)] text-[var(--color-text-primary)]">
      <section className="border-b border-[var(--color-border-subtle)] bg-[var(--color-bg-level-1)]">
        <Container className="py-20 md:py-28">
          <p className="h-eyebrow mb-4 text-[var(--color-accent)]">The Legendary catalog</p>
          <div className="grid gap-8 lg:grid-cols-[1.15fr_.85fr] lg:items-end">
            <h1 className="max-w-4xl font-serif text-[clamp(3.5rem,9vw,8rem)] font-normal leading-[.84] tracking-[-.06em]">
              Find your
              <br />
              weight.
            </h1>
            <p className="max-w-xl text-lg leading-relaxed text-[var(--color-text-secondary)]">
              Explore the live Legendary catalog by silhouette, season, and point of view. Start with the collection that fits the way you want to wear the brand.
            </p>
          </div>
        </Container>
      </section>

      <Container className="py-16 md:py-24">
      <JsonLd data={breadcrumbJsonLd} />
      <div className="mb-10 flex items-end justify-between gap-6">
        <div>
          <p className="h-eyebrow mb-3">Shop by intent</p>
          <h2 className="font-serif text-3xl font-normal tracking-tight md:text-5xl">Live collections</h2>
        </div>
        <p className="hidden max-w-xs text-right text-sm leading-relaxed text-[var(--color-text-secondary)] md:block">
          Customer-facing collections only. Empty and unpublished collections stay out of the shopping path.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {liveCollections.map((collection) => (
          <Link
            key={collection.id}
            to={`/collections/${collection.handle}`}
            prefetch="intent"
            className="group block"
          >
            <div className="relative mb-4 aspect-square overflow-hidden rounded-[var(--radius-card)] bg-[var(--color-bg-level-2)]">
              {collection.image ? (
                <Image
                  data={collection.image}
                  aspectRatio="1/1"
                  width={900}
                  height={900}
                  sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                  className="h-full w-full object-cover transition-transform duration-500 ease-[var(--ease-expo)] group-hover:scale-[1.04]"
                  loading="lazy"
                />
              ) : (
                <Placeholder aspect="aspect-square" label={collection.title} />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/5 to-transparent" />
              <span className="absolute bottom-4 left-4 font-mono text-[10px] uppercase tracking-[.12em] text-white/75">
                Enter collection ↗
              </span>
            </div>
            <div className="flex items-baseline justify-between gap-4">
              <span className="font-serif text-xl leading-tight text-[var(--color-text-primary)] transition-colors group-hover:text-[var(--color-accent)]">
                {collection.title}
              </span>
              <span className="shrink-0 font-mono text-[10px] uppercase tracking-[.08em] text-[var(--color-text-tertiary)]">
                Live
              </span>
            </div>
            {collection.description && (
              <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-[var(--color-text-secondary)]">
                {collection.description}
              </p>
            )}
          </Link>
        ))}
      </div>
      </Container>

      <section className="grid gap-10 bg-[var(--color-accent)] px-[var(--spacing-page-x)] py-20 text-white md:grid-cols-2 md:gap-20 md:py-28">
        <div>
          <p className="h-eyebrow text-white/70">The Legendary standard</p>
          <h2 className="mt-5 max-w-xl text-[clamp(3rem,7vw,7rem)] font-normal leading-[.88] tracking-[-.07em] text-white">
            Choose the<br />
            point of view.
          </h2>
        </div>
        <div className="max-w-xl self-end text-lg leading-relaxed text-white/90">
          <p>Every collection is a different entry point into the same idea: heavyweight pieces, considered graphics, and silhouettes built to stay in rotation.</p>
          <p className="mt-6">Start with the shape that feels like you, then build from there.</p>
        </div>
      </section>

      <section className="bg-[var(--color-bg-level-2)] px-[var(--spacing-page-x)] py-20 md:py-28">
        <div className="mx-auto max-w-[var(--container-max-width)]">
          <p className="h-eyebrow">Find your entry point</p>
          <div className="mt-8 grid gap-3 md:grid-cols-3">
            {liveCollections.slice(0, 3).map((collection, index) => (
              <Link key={collection.id} to={`/collections/${collection.handle}`} className={`group min-h-64 bg-[var(--color-bg-level-1)] p-6 transition-transform duration-300 hover:-translate-y-1 ${index === 1 ? 'bg-[var(--color-accent)] text-white' : ''}`}>
                <span className={`font-mono text-[10px] uppercase tracking-[.12em] ${index === 1 ? 'text-white/70' : 'text-[var(--color-text-tertiary)]'}`}>0{index + 1} / Collection</span>
                <h3 className={`mt-16 text-3xl font-normal leading-[.9] tracking-[-.05em] ${index === 1 ? 'text-white' : 'text-[var(--color-text-primary)]'}`}>{collection.title}</h3>
                <span className={`mt-6 inline-block font-mono text-xs uppercase tracking-[.08em] ${index === 1 ? 'text-white' : 'text-[var(--color-text-secondary)]'}`}>Explore ↗</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-[var(--color-bg-level-1)] px-[var(--spacing-page-x)] py-20 md:py-28">
        <div className="mx-auto max-w-3xl border-t border-[var(--color-border-medium)]">
          <details open className="border-b border-[var(--color-border-medium)] py-5">
            <summary className="flex cursor-pointer list-none justify-between font-serif text-xl">How do I choose a collection?<span className="font-mono text-2xl text-[var(--color-accent)]">+</span></summary>
            <p className="max-w-2xl pt-4 text-[var(--color-text-secondary)]">Use the collection description and product details to compare weight, silhouette, graphic language, and intended use before you shop.</p>
          </details>
          <details className="border-b border-[var(--color-border-medium)] py-5">
            <summary className="flex cursor-pointer list-none justify-between font-serif text-xl">Are the collections live?<span className="font-mono text-2xl text-[var(--color-accent)]">+</span></summary>
            <p className="max-w-2xl pt-4 text-[var(--color-text-secondary)]">Yes. This page is sourced from customer-facing Shopify collections with products available in the storefront.</p>
          </details>
        </div>
      </section>
    </div>
  );
}

