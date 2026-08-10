import {type LoaderFunctionArgs, type MetaFunction} from 'react-router';
import {useLoaderData, Link} from 'react-router';
import {getPaginationVariables, Image} from '@shopify/hydrogen';
import Container from '~/components/ui/Container';
import Placeholder from '~/components/ui/Placeholder';
import Button from '~/components/ui/Button';
import JsonLd from '~/components/ui/JsonLd';
import ProductCard, {
  PRODUCT_CARD_FRAGMENT,
  type ProductCardFragment,
} from '~/components/ui/ProductCard';

type CollectionImageNode = {
  id: string;
  title: string;
  handle: string;
  image?: {
    url: string;
    altText?: string | null;
    width?: number | null;
    height?: number | null;
  } | null;
};

const HOMEPAGE_QUERY = `#graphql
  ${PRODUCT_CARD_FRAGMENT}
  query Homepage($country: CountryCode, $language: LanguageCode, $first: Int!)
    @inContext(country: $country, language: $language) {
    featuredCollections: collections(first: 4, sortKey: UPDATED_AT) {
      nodes {
        id
        title
        handle
        image {
          url
          altText
          width
          height
        }
      }
    }
    newDrops: collection(handle: "all-products") {
      products(first: $first, sortKey: CREATED) {
        nodes {
          ...ProductCard
        }
      }
    }
  }
` as const;

export const meta: MetaFunction = () => {
  const description = 'Premium editorial streetwear. Bold, minimal, fast.';
  return [
    {title: 'LEGENDARY BRANDING — Premium Editorial Streetwear'},
    {name: 'description', content: description},
    {tagName: 'link', rel: 'canonical', href: 'https://legendary-branding.com/'},
    {property: 'og:type', content: 'website'},
    {property: 'og:title', content: 'LEGENDARY BRANDING'},
    {property: 'og:description', content: description},
    {property: 'og:url', content: 'https://legendary-branding.com/'},
    {name: 'twitter:card', content: 'summary'},
    {name: 'twitter:title', content: 'LEGENDARY BRANDING'},
    {name: 'twitter:description', content: description},
  ];
};

export async function loader({context, request}: LoaderFunctionArgs) {
  const {storefront} = context;
  const paginationVariables = getPaginationVariables(request, {
    pageBy: 4,
  });

  const {featuredCollections, newDrops} = await storefront.query(
    HOMEPAGE_QUERY,
    {
      variables: {
        ...paginationVariables,
        first: 4,
        country: storefront.i18n.country,
        language: storefront.i18n.language,
      },
    },
  );

  return {featuredCollections, newDrops};
}

const ORG_JSONLD = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: 'Legendary Branding',
  url: 'https://legendary-branding.com',
  logo: 'https://legendary-branding.com/favicon.ico',
  sameAs: [],
};

export default function Homepage() {
  const {featuredCollections, newDrops} = useLoaderData<typeof loader>();

  return (
    <div>
      <JsonLd data={ORG_JSONLD} />
      {/* Hero — full-bleed campaign image placeholder */}
      <section className="relative w-full aspect-[16/9] md:aspect-[21/9] bg-[#f7f7f7] overflow-hidden">
        <Placeholder
          aspect="aspect-auto"
          label="Hero Campaign Image"
          className="absolute inset-0 w-full h-full"
        />
        <div className="absolute inset-0 flex flex-col items-start justify-end p-[clamp(1.5rem,5vw,4rem)] pb-[clamp(2rem,6vw,5rem)]">
          <span className="text-[10px] font-semibold tracking-widest uppercase text-white/70 mb-3">
            New Drop
          </span>
          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-bold tracking-tight text-white leading-none mb-6">
            Stay
            <br />
            Legendary.
          </h1>
          <Button as="link" to="/collections/all-products" variant="primary">
            Shop New Drops
          </Button>
        </div>
      </section>

      {/* Collections grid */}
      <Container className="py-20">
        <div className="flex items-baseline justify-between mb-10">
          <h2 className="text-xs font-semibold tracking-widest uppercase">
            Shop by Category
          </h2>
          <Button as="link" to="/collections" variant="ghost">
            All Collections
          </Button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {(featuredCollections.nodes as CollectionImageNode[]).map((collection) => (
            <Link
              key={collection.id}
              to={`/collections/${collection.handle}`}
              prefetch="intent"
              className="group block"
            >
              <div className="relative overflow-hidden mb-3">
                {collection.image ? (
                  <Image
                    data={collection.image}
                    aspectRatio="3/4"
                    sizes="(min-width: 768px) 25vw, 50vw"
                    className="w-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                ) : (
                  <Placeholder aspect="aspect-[3/4]" label={collection.title} />
                )}
              </div>
              <span className="text-xs font-medium tracking-[0.15em] uppercase text-[#0a0a0a] group-hover:text-[#6b6b6b] transition-colors">
                {collection.title}
              </span>
            </Link>
          ))}
        </div>
      </Container>

      {/* New Drops */}
      <section className="bg-[#f7f7f7]">
        <Container className="py-20">
          <div className="flex items-baseline justify-between mb-10">
            <h2 className="text-xs font-semibold tracking-widest uppercase">
              New Drops
            </h2>
            <Button as="link" to="/collections/all-products" variant="ghost">
              View All
            </Button>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {(newDrops?.products.nodes as ProductCardFragment[] | undefined)?.map((product, i) => (
              <ProductCard
                key={product.id}
                product={product}
                loading={i < 2 ? 'eager' : 'lazy'}
              />
            ))}
          </div>
        </Container>
      </section>

      {/* Editorial CTA */}
      <Container className="py-24 text-center">
        <p className="text-[10px] font-semibold tracking-widest uppercase text-[#6b6b6b] mb-4">
          The Journal
        </p>
        <h2 className="text-3xl sm:text-5xl font-bold tracking-tight mb-6">
          Culture. Craft. Community.
        </h2>
        <Button as="link" to="/journal" variant="outline">
          Read the Journal
        </Button>
      </Container>
    </div>
  );
}
