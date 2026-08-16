import {type LoaderFunctionArgs, type MetaFunction} from 'react-router';
import {useLoaderData, Link} from 'react-router';
import {getPaginationVariables, Image} from '@shopify/hydrogen';
import Container from '~/components/ui/Container';
import Button from '~/components/ui/Button';
import ProductCard, {
  PRODUCT_CARD_FRAGMENT,
  type ProductCardFragment,
} from '~/components/ui/ProductCard';
import StreetHero from '~/components/sections/StreetHero';
import BrandMarquee from '~/components/sections/BrandMarquee';
import StatStrip from '~/components/sections/StatStrip';
import CollectionGrid from '~/components/sections/CollectionGrid';
import BrandStory from '~/components/sections/BrandStory';
import Testimonials from '~/components/sections/Testimonials';
import DropTimer from '~/components/sections/DropTimer';
import Lookbook from '~/components/sections/Lookbook';
import NewsletterPopup from '~/components/sections/NewsletterPopup';
import {CacheLong} from '~/lib/cache';

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
      cache: CacheLong(),
    });

  return {featuredCollections, newDrops, bestSellers};
}

const MARQUEE_ITEMS = [
  '235GSM+ HEAVYWEIGHT TEES',
  'MADE TO ORDER',
  'FREE SHIPPING OVER $150',
  'WORLDWIDE SHIPPING',
  'AUTHENTICITY GUARANTEED',
  'NEW DROPS EVERY FRIDAY',
  'DTG PRINTS',
];

const TESTIMONIALS = [
  {
    quote: "This is the heaviest tee I've ever owned. The quality is unreal — you can feel the difference the second you put it on.",
    name: 'Marcus T.',
    location: 'Atlanta, GA',
    stars: 5,
  },
  {
    quote: "Made to order means I actually had to wait — but it was worth every day. Fits perfectly, no shrinkage after washing.",
    name: 'Jordan L.',
    location: 'London, UK',
    stars: 5,
  },
  {
    quote: "The DTG print quality blew me away. Sharp edges, no cracking. Other brands can't touch this.",
    name: 'Aaliyah M.',
    location: 'Toronto, CA',
    stars: 5,
  },
];

// Next drop date (30 days from build — update for real drops)
const NEXT_DROP_DATE = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

export default function Homepage() {
  const {featuredCollections, newDrops, bestSellers} =
    useLoaderData<typeof loader>();

  const newDropsProducts = newDrops?.products?.nodes as
    | ProductCardFragment[]
    | undefined;
  const bestSellerProducts = bestSellers?.products?.nodes as
    | ProductCardFragment[]
    | undefined;

  // Use first available product image for hero (placeholder if none)
  const firstProduct = newDropsProducts?.[0];
  const secondProduct = newDropsProducts?.[1];

  // Build lookbook items from best sellers (only products with images)
  const lookbookItems = (bestSellerProducts ?? [])
    .filter((product) => product.featuredImage?.url)
    .map((product, i) => ({
      id: product.id,
      image: product.featuredImage!,
      product: {
        handle: product.handle,
        title: product.title,
        price: product.priceRange.minVariantPrice,
        image: product.featuredImage!,
      },
      hotspotX: 50,
      hotspotY: 50,
      spanCols: i === 0 ? 6 : i === 1 ? 3 : i === 2 ? 3 : 6,
      spanRows: i === 0 ? 3 : i === 1 ? 2 : i === 2 ? 2 : 2,
    }));

  return (
    <div>
      {/* 1. Street Hero */}
      <StreetHero
        eyebrow="235GSM+ Tees · Made To Order · DTG Prints"
        heading="Legendary Branding"
        subtext="Shop Heavyweight Essentials — premium streetwear built to last."
        buttonLabel="Shop Heavyweight Essentials"
        buttonLink="/collections/all-products"
        imageLeft={firstProduct?.featuredImage}
        imageRight={secondProduct?.featuredImage}
        splitLayout={!!firstProduct?.featuredImage?.url && !!secondProduct?.featuredImage?.url}
        contentAlignment="bottom-left"
        fullScreen
      />

      {/* 2. Brand Marquee */}
      <BrandMarquee items={MARQUEE_ITEMS} style="bold" speed={30} />

      {/* 3. Stat Strip */}
      <StatStrip />

      {/* 4. Collection Grid */}
      <CollectionGrid
        eyebrow="Explore"
        heading="Shop by Category"
        linkLabel="View all collections"
        linkUrl="/collections"
        collections={(featuredCollections?.nodes as CollectionNode[]) ?? []}
        columns={3}
      />

      {/* 5. Brand Story */}
      <BrandStory
        eyebrow="Our Craft"
        heading="Built Different. Made to Last."
        body="Every piece starts with fabric weight most brands won't touch — 235GSM+ cotton, structured for the streets. Made to order. No shortcuts, no restocks. If you know, you know."
        buttonLabel="Shop the Collection"
        buttonLink="/collections/all-products"
        imagePosition="left"
      />

      {/* 6. Best Sellers */}
      {bestSellerProducts && bestSellerProducts.length > 0 && (
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
              {bestSellerProducts.slice(0, 4).map((product, i) => (
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
      )}

      {/* 8. Testimonials */}
      <Testimonials
        eyebrow="Customer Reviews"
        heading="The Culture Speaks"
        items={TESTIMONIALS}
      />

      {/* 9. Drop Timer */}
      <DropTimer
        eyebrow="Coming Soon"
        heading="Next Drop"
        description="New limited edition pieces dropping soon. Made to order — no restocks, no second chances."
        dropDate={NEXT_DROP_DATE}
        buttonLabel="Shop Now"
        buttonLink="/collections/all-products"
      />

      {/* 6. New Drops */}
      {newDropsProducts && newDropsProducts.length > 0 && (
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
              {newDropsProducts.slice(0, 8).map((product, i) => (
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
      )}

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

      {/* Newsletter Popup */}
      <NewsletterPopup />

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
