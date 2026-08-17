import {type LoaderFunctionArgs, type MetaFunction} from 'react-router';
import {useLoaderData, Link} from 'react-router';
import {getPaginationVariables} from '@shopify/hydrogen';
import ProductCard, {
  PRODUCT_CARD_FRAGMENT,
  type ProductCardFragment,
} from '~/components/ui/ProductCard';
import HeroPlaceholder from '~/components/ui/HeroPlaceholder';
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
  const description = 'Premium editorial streetwear. Limited drops, exceptional quality.';
  return [
    {title: 'LEGENDARY — Premium Editorial Streetwear'},
    {name: 'description', content: description},
    {tagName: 'link', rel: 'canonical', href: 'https://legendary-branding.com/'},
    {property: 'og:type', content: 'website'},
    {property: 'og:title', content: 'LEGENDARY'},
    {property: 'og:description', content: description},
    {property: 'og:url', content: 'https://legendary-branding.com/'},
    {name: 'twitter:card', content: 'summary_large_image'},
    {name: 'twitter:title', content: 'LEGENDARY'},
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

export default function Homepage() {
  const {featuredCollections, newDrops, bestSellers} =
    useLoaderData<typeof loader>();

  const newDropsProducts = newDrops?.products?.nodes as
    | ProductCardFragment[]
    | undefined;
  const bestSellerProducts = bestSellers?.products?.nodes as
    | ProductCardFragment[]
    | undefined;
  const collections = (featuredCollections?.nodes as CollectionNode[]) ?? [];
  const featured3 = collections.slice(0, 3);

  return (
    <div>
      {/* ── 1. HERO — split-screen editorial ── */}
      <section className="relative">
        <div className="grid grid-cols-1 lg:grid-cols-[1.5fr_1fr] min-h-[80vh] lg:min-h-[85vh]">
          {/* Left: big image */}
          <div className="relative overflow-hidden bg-[#E8E6E1] aspect-[4/5] lg:aspect-auto">
            <HeroPlaceholder variant="dark" />
            {/* Overlay text at bottom left */}
            <div className="absolute bottom-8 left-8 right-8 z-10">
              <p className="text-white/80 text-xs uppercase tracking-[0.15em] mb-3 font-medium">
                Fall / Winter 2025
              </p>
              <h1 className="font-serif text-white text-display-1 leading-[0.9] tracking-tight max-w-[10ch]">
                The New Season
              </h1>
            </div>
          </div>

          {/* Right: content */}
          <div className="flex flex-col justify-center px-[clamp(1.5rem,5vw,4rem)] py-16 lg:py-0 bg-[#FAF9F6]">
            <p className="text-eyebrow mb-4">New Drop — Available Now</p>
            <h2 className="font-serif text-display-2 leading-[1.05] tracking-tight mb-6 max-w-[12ch]">
              Built to last, made to fade.
            </h2>
            <p className="text-base text-[#6B6B6B] leading-relaxed mb-10 max-w-md">
              Heavyweight essentials cut from premium textiles. Every piece
              made in small batches — quality before quantity.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link
                to="/collections/new-arrivals"
                className="btn btn-primary btn-lg"
              >
                Shop New
              </Link>
              <Link
                to="/collections/all-products"
                className="btn btn-outline btn-lg"
              >
                Browse All
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── 2. FEATURED CATEGORIES — 3-up image grid ── */}
      <section className="section">
        <div className="container-x">
          <div className="flex items-end justify-between mb-10 md:mb-14 flex-wrap gap-4">
            <div>
              <p className="text-eyebrow mb-2">Shop by Category</p>
              <h2 className="font-serif text-display-3 leading-[1.1] tracking-tight">
                Essentials
              </h2>
            </div>
            <Link
              to="/collections/all-products"
              className="link-underline text-caps text-[#1A1A1A]"
            >
              View All →
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
            {featured3.length > 0
              ? featured3.map((col, i) => (
                  <Link
                    key={col.id}
                    to={`/collections/${col.handle}`}
                    className="group relative overflow-hidden aspect-[3/4] bg-[#E8E6E1] img-zoom"
                  >
                    {col.image?.url ? (
                      <img
                        src={col.image.url}
                        alt={col.image.altText || col.title}
                        className="w-full h-full object-cover"
                        loading="eager"
                      />
                    ) : (
                      <HeroPlaceholder variant="light" />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-[#1A1A1A]/40 to-transparent" />
                    <div className="absolute bottom-6 left-6 right-6 z-10">
                      <h3 className="font-serif text-3xl md:text-4xl text-white leading-tight">
                        {col.title}
                      </h3>
                      <p className="text-white/80 text-xs uppercase tracking-[0.15em] mt-2 font-medium">
                        Explore →
                      </p>
                    </div>
                  </Link>
                ))
              : [...Array(3)].map((_, i) => (
                  <div
                    key={i}
                    className="relative overflow-hidden aspect-[3/4] bg-[#E8E6E1]"
                  >
                    <HeroPlaceholder variant="light" />
                    <div className="absolute bottom-6 left-6 z-10">
                      <h3 className="font-serif text-3xl text-white">
                        {['Tees', 'Hoodies', 'Outerwear'][i]}
                      </h3>
                    </div>
                  </div>
                ))}
          </div>
        </div>
      </section>

      {/* ── 3. NEW ARRIVALS — asymmetric grid ── */}
      <section className="section-sm bg-white">
        <div className="container-x">
          <div className="flex items-end justify-between mb-10 md:mb-14 flex-wrap gap-4">
            <div>
              <p className="text-eyebrow mb-2">Just Dropped</p>
              <h2 className="font-serif text-display-3 leading-[1.1] tracking-tight">
                New Arrivals
              </h2>
            </div>
            <Link
              to="/collections/all-products"
              className="link-underline text-caps text-[#1A1A1A]"
            >
              View All →
            </Link>
          </div>

          {/* Asymmetric grid: first product spans 2 cols on lg */}
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-4 gap-3 md:gap-5">
            {(newDropsProducts ?? []).slice(0, 4).map((product, i) => (
              <div
                key={product.id}
                className={i === 0 ? 'lg:col-span-2 lg:row-span-1' : ''}
              >
                <ProductCard
                  product={product}
                  showVendor={false}
                />
              </div>
            ))}
          </div>

          {/* Second row — 4 products */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-5 mt-3 md:mt-5">
            {(newDropsProducts ?? []).slice(4, 8).map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                showVendor={false}
              />
            ))}
          </div>
        </div>
      </section>

      {/* ── 4. EDITORIAL — image + text ── */}
      <section className="section">
        <div className="container-x">
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_1fr] gap-8 lg:gap-16 items-center">
            {/* Image */}
            <div className="relative aspect-[3/2] bg-[#E8E6E1] overflow-hidden">
              <HeroPlaceholder variant="dark" />
            </div>

            {/* Text */}
            <div className="lg:pl-8">
              <p className="text-eyebrow mb-4">Our Philosophy</p>
              <h2 className="font-serif text-display-3 leading-[1.1] tracking-tight mb-6">
                Less but better. Every piece earns its place.
              </h2>
              <p className="text-base text-[#6B6B6B] leading-relaxed mb-6">
                We don't chase trends. We build a wardrobe of pieces you'll
                reach for every day — cut from heavyweight fabrics, stitched
                with care, made to improve with age.
              </p>
              <p className="text-base text-[#6B6B6B] leading-relaxed mb-8">
                Small batch production means zero waste, fair wages, and a
                product that actually lasts. That's the Legendary promise.
              </p>
              <Link to="/pages/about" className="link-underline text-caps">
                Our Story →
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── 5. BEST SELLERS ── */}
      <section className="section-sm bg-white">
        <div className="container-x">
          <div className="flex items-end justify-between mb-10 md:mb-14 flex-wrap gap-4">
            <div>
              <p className="text-eyebrow mb-2">Fan Favorites</p>
              <h2 className="font-serif text-display-3 leading-[1.1] tracking-tight">
                Best Sellers
              </h2>
            </div>
            <Link
              to="/collections/best-sellers"
              className="link-underline text-caps text-[#1A1A1A]"
            >
              Shop All →
            </Link>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-5">
            {(bestSellerProducts ?? []).map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                showVendor={false}
              />
            ))}
          </div>
        </div>
      </section>

      {/* ── 6. NEWSLETTER — full-width dark ── */}
      <section className="bg-[#1A1A1A] text-[#FAF9F6] py-20 md:py-28">
        <div className="container-x">
          <div className="max-w-2xl mx-auto text-center">
            <p className="text-xs uppercase tracking-[0.15em] text-white/60 font-medium mb-4">
              Join the List
            </p>
            <h2 className="font-serif text-display-3 leading-[1.05] tracking-tight mb-5">
              First access to new drops.
            </h2>
            <p className="text-white/60 text-base mb-8 max-w-lg mx-auto">
              Subscribers get 24 hours early access before every release.
              No spam, just drops.
            </p>

            <form
              className="flex gap-2 max-w-md mx-auto"
              onSubmit={(e) => {
                e.preventDefault();
                // Newsletter signup — connect to Klaviyo/Shopify
              }}
            >
              <input
                type="email"
                required
                placeholder="Enter your email"
                className="flex-1 bg-transparent border-b border-white/30 text-white placeholder:text-white/40 py-3 px-1 text-base focus:outline-none focus:border-white transition-colors"
              />
              <button
                type="submit"
                className="btn btn-primary btn-sm shrink-0"
              >
                Subscribe
              </button>
            </form>
          </div>
        </div>
      </section>
    </div>
  );
}
