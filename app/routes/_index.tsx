import {type LoaderFunctionArgs, type MetaFunction} from 'react-router';
import {useLoaderData, Link} from 'react-router';
import {getPaginationVariables, Image} from '@shopify/hydrogen';
import Container from '~/components/ui/Container';
import Placeholder from '~/components/ui/Placeholder';
import Button from '~/components/ui/Button';
import ProductCard, {
  PRODUCT_CARD_FRAGMENT,
  type ProductCardFragment,
} from '~/components/ui/ProductCard';
import StreetHero from '~/components/sections/StreetHero';
import BrandMarquee from '~/components/sections/BrandMarquee';
import CollectionGrid from '~/components/sections/CollectionGrid';
import DropTimer from '~/components/sections/DropTimer';
import Lookbook from '~/components/sections/Lookbook';

type CollectionNode = {
  id: string;
  title: string;
  handle: string;
  description?: string | null;
  image?: {
    url: string;
    altText?: string | null;
    width?: number | null;
    height?: number | null;
  } | null;
  products?: {nodes: Array<{id: string}>};
};

const HOMEPAGE_QUERY = `#graphql
  ${PRODUCT_CARD_FRAGMENT}
  query Homepage($country: CountryCode, $language: LanguageCode, $first: Int!)
    @inContext(country: $country, language: $language) {
    featuredCollections: collections(first: 6, sortKey: UPDATED_AT) {
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
          nodes { id }
        }
      }
    }
    newDrops: collection(handle: "all-products") {
      products(first: 8, sortKey: CREATED) {
        nodes {
          ...ProductCard
        }
      }
    }
    bestSellers: collection(handle: "all-products") {
      products(first: 4, sortKey: BEST_SELLING) {
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
    {name: 'twitter:card', content: 'summary_large_image'},
    {name: 'twitter:title', content: 'LEGENDARY BRANDING'},
    {name: 'twitter:description', content: description},
  ];
};

export async function loader({context, request}: LoaderFunctionArgs) {
  const {storefront} = context;
  const paginationVariables = getPaginationVariables(request, {
    pageBy: 8,
  });

  const {featuredCollections, newDrops, bestSellers} =
    await storefront.query(HOMEPAGE_QUERY, {
      variables: {
        ...paginationVariables,
        first: 8,
        country: storefront.i18n.country,
        language: storefront.i18n.language,
      },
    });

  return {featuredCollections, newDrops, bestSellers};
}

// Marquee items — matches the LB theme defaults
const MARQUEE_ITEMS = [
  'FREE SHIPPING OVER $150',
  'WORLDWIDE SHIPPING',
  'AUTHENTICITY GUARANTEED',
  'NEW DROPS EVERY FRIDAY',
];

// Next drop date (30 days from build — update for real drops)
const NEXT_DROP_DATE = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

export default function Homepage() {
  const {featuredCollections, newDrops, bestSellers} =
    useLoaderData<typeof loader>();

  // Use first available product image for hero (placeholder if none)
  const firstProduct = newDrops?.products?.nodes?.[0] as
    | ProductCardFragment
    | undefined;
  const secondProduct = newDrops?.products?.nodes?.[1] as
    | ProductCardFragment
    | undefined;

  // Build lookbook items from best sellers
  const lookbookItems = (
    (bestSellers?.products?.nodes as ProductCardFragment[] | undefined) ?? []
  ).map((product, i) => ({
    id: product.id,
    image: product.featuredImage
      ? product.featuredImage
      : {
          url: '',
          altText: product.title,
        },
    product: product.featuredImage
      ? {
          handle: product.handle,
          title: product.title,
          price: product.priceRange.minVariantPrice,
          image: product.featuredImage,
        }
      : null,
    hotspotX: 50,
    hotspotY: 50,
    spanCols: i === 0 ? 6 : i === 1 ? 3 : i === 2 ? 3 : 6,
    spanRows: i === 0 ? 3 : i === 1 ? 2 : i === 2 ? 2 : 2,
  }));

  return (
    <div>
      {/* 1. Street Hero */}
      <StreetHero
        eyebrow="New Drop — SS25"
        heading="Stay Legendary"
        subtext="Limited edition drops every Friday. Only what's essential. No restocks."
        buttonLabel="Shop New Drops"
        buttonLink="/collections/all-products"
        imageLeft={
          firstProduct?.featuredImage ?? {
            url: '',
            altText: 'Hero campaign image',
          }
        }
        imageRight={
          secondProduct?.featuredImage ?? {
            url: '',
            altText: 'Hero secondary image',
          }
        }
        splitLayout={!!firstProduct?.featuredImage && !!secondProduct?.featuredImage}
        contentAlignment="bottom-left"
        fullScreen
      />

      {/* 2. Brand Marquee */}
      <BrandMarquee items={MARQUEE_ITEMS} style="bold" speed={30} />

      {/* 3. Collection Grid */}
      <CollectionGrid
        eyebrow="Explore"
        heading="Shop by Category"
        linkLabel="View all collections"
        linkUrl="/collections"
        collections={featuredCollections.nodes as CollectionNode[]}
        columns={3}
      />

      {/* 4. Best Sellers */}
      <section className="lb-section bg-[#f5f5f5]">
        <div className="lb-container">
          <div className="lb-section-header">
            <div>
              <div className="lb-eyebrow mb-2">Best Sellers</div>
              <h2>Most Wanted</h2>
            </div>
            <Link
              to="/collections/all-products"
              className="lb-section-header__link"
            >
              View All
            </Link>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {(bestSellers?.products?.nodes as
              | ProductCardFragment[]
              | undefined)
              ?.slice(0, 4)
              .map((product, i) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  loading={i < 2 ? 'eager' : 'lazy'}
                  hoverFlip
                  showQuickAdd
                />
              ))}
          </div>
        </div>
      </section>

      {/* 5. Drop Timer */}
      <DropTimer
        eyebrow="Limited Drop"
        heading="SS25 Collection"
        description="Drops Friday at 10AM EST. Only 200 units produced. Once they're gone, they're gone."
        dropDate={NEXT_DROP_DATE}
        buttonLabel="Set Reminder"
        buttonLink="#"
      />

      {/* 6. New Drops */}
      <section className="lb-section">
        <div className="lb-container">
          <div className="lb-section-header">
            <div>
              <div className="lb-eyebrow mb-2">Just Dropped</div>
              <h2>New Arrivals</h2>
            </div>
            <Link
              to="/collections/all-products"
              className="lb-section-header__link"
            >
              View All
            </Link>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {(newDrops?.products?.nodes as
              | ProductCardFragment[]
              | undefined)
              ?.slice(0, 8)
              .map((product, i) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  loading={i < 2 ? 'eager' : 'lazy'}
                  hoverFlip
                  showQuickAdd
                />
              ))}
          </div>
        </div>
      </section>

      {/* 7. Lookbook */}
      {lookbookItems.length > 0 && (
        <Lookbook
          eyebrow="The Collection"
          heading="SS25 Lookbook"
          linkLabel="Shop the Look"
          linkUrl="/collections/all-products"
          items={lookbookItems}
          gridStyle="editorial"
        />
      )}

      {/* 8. Journal CTA */}
      <section className="lb-section text-center bg-[#f5f5f5]">
        <div className="lb-container max-w-3xl">
          <div className="lb-eyebrow mb-4">The Journal</div>
          <h2 className="mb-6">Culture. Craft. Community.</h2>
          <p className="text-black/60 max-w-xl mx-auto mb-8 leading-relaxed">
            Stories from the culture. Behind-the-scenes drops, artist
            collaborations, and the people who make Legendary.
          </p>
          <Button as="link" to="/journal" variant="solid" size="lg">
            Read the Journal
          </Button>
        </div>
      </section>
    </div>
  );
}
