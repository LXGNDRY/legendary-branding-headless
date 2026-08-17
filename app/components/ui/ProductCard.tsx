import {Link, useFetcher} from 'react-router';
import {Image, Money} from '@shopify/hydrogen';
import type {CurrencyCode} from '@shopify/hydrogen/storefront-api-types';
import Badge from '~/components/ui/Badge';
import WishlistButton from '~/components/ui/WishlistButton';
import Placeholder from '~/components/ui/Placeholder';

type MoneyFragment = {
  amount: string;
  currencyCode: CurrencyCode;
};

export type ProductCardFragment = {
  id: string;
  title: string;
  handle: string;
  availableForSale: boolean;
  vendor?: string | null;
  featuredImage?: {
    url: string;
    altText?: string | null;
    width?: number | null;
    height?: number | null;
  } | null;
  images?: {
    nodes: Array<{
      url: string;
      altText?: string | null;
      width?: number | null;
      height?: number | null;
    }>;
  } | null;
  priceRange: {
    minVariantPrice: MoneyFragment;
    maxVariantPrice: MoneyFragment;
  };
  compareAtPriceRange: {
    minVariantPrice: MoneyFragment;
  };
  tags: string[];
};

export const PRODUCT_CARD_FRAGMENT = `#graphql
  fragment ProductCard on Product {
    id
    title
    handle
    availableForSale
    vendor
    featuredImage {
      id
      url
      altText
      width
      height
    }
    images(first: 2) {
      nodes {
        id
        url
        altText
        width
        height
      }
    }
    priceRange {
      minVariantPrice {
        amount
        currencyCode
      }
      maxVariantPrice {
        amount
        currencyCode
      }
    }
    compareAtPriceRange {
      minVariantPrice {
        amount
        currencyCode
      }
    }
    tags
  }
` as const;

function isOnSale(product: ProductCardFragment) {
  return (
    Number(product.compareAtPriceRange?.minVariantPrice?.amount) >
    Number(product.priceRange?.minVariantPrice?.amount)
  );
}

function isNew(product: ProductCardFragment) {
  return product.tags.includes('new');
}

/**
 * HANSSEN x LEGENDARY — Product Card
 *
 * Large image, minimal UI. Signature Hanssen style:
 * - Image fills the card, 3/4 aspect
 * - Hover: image zooms in, secondary image fades in
 * - Hover: "Quick add" button slides up from bottom
 * - Below image: title (regular weight, not bold) + price on same line
 * - Wishlist heart appears in top-right on hover
 */
export default function ProductCard({
  product,
  loading = 'lazy',
  showVendor = false,
  showQuickAdd = true,
  hoverFlip = true,
  layout = 'grid',
  onQuickAdd,
}: {
  product: ProductCardFragment;
  loading?: 'eager' | 'lazy';
  showVendor?: boolean;
  showQuickAdd?: boolean;
  hoverFlip?: boolean;
  layout?: 'grid' | 'list';
  /** Called when quick add is clicked (first variant by default) */
  onQuickAdd?: (productId: string) => void;
}) {
  const onSale = isOnSale(product);
  const soldOut = !product.availableForSale;
  const isNewTag = isNew(product);
  const hasSecondImage =
    hoverFlip &&
    product.images?.nodes &&
    product.images.nodes.length > 1 &&
    product.images.nodes[1];

  // List layout
  if (layout === 'list') {
    return (
      <article
        className={`group flex gap-6 border-b border-[#E8E6E1] py-6 cursor-pointer ${
          soldOut ? 'opacity-60' : ''
        }`}
        data-product-id={product.id}
      >
        {/* Media */}
        <Link
          to={`/products/${product.handle}`}
          prefetch="intent"
          className="relative overflow-hidden w-28 h-36 md:w-36 md:h-48 shrink-0 bg-[#E8E6E1] img-zoom"
        >
          {product.featuredImage ? (
            <Image
              data={product.featuredImage}
              aspectRatio="3/4"
              sizes="150px"
              loading={loading}
              className="w-full h-full object-cover"
            />
          ) : (
            <Placeholder aspect="aspect-[3/4]" label={product.title} />
          )}
        </Link>

        {/* Info */}
        <div className="flex-1 flex flex-col justify-between py-1">
          <div>
            {showVendor && product.vendor && (
              <div className="text-eyebrow mb-1">
                {product.vendor}
              </div>
            )}
            <Link
              to={`/products/${product.handle}`}
              prefetch="intent"
              className="text-lg font-serif hover:text-[#6B6B6B] transition-colors block mb-2"
            >
              {product.title}
            </Link>
            <p className="text-sm text-[#6B6B6B] line-clamp-2 hidden md:block">
              {product.tags.slice(0, 3).join(' · ')}
            </p>
          </div>

          <div className="flex items-end justify-between">
            <div className="flex gap-2 items-baseline">
              <Money
                data={product.priceRange.minVariantPrice}
                className="text-lg font-serif text-[#1A1A1A]"
              />
              {onSale && (
                <Money
                  data={product.compareAtPriceRange.minVariantPrice}
                  className="text-[#6B6B6B] line-through font-normal text-sm"
                />
              )}
            </div>
            {showQuickAdd && product.availableForSale && (
              <Link
                to={`/products/${product.handle}`}
                className="text-caps border-b border-[#1A1A1A] pb-0.5 hover:opacity-60 transition-opacity"
              >
                View
              </Link>
            )}
          </div>
        </div>
      </article>
    );
  }

  // Grid layout (default)
  return (
    <article
      className={`group flex flex-col gap-3 cursor-pointer ${
        soldOut ? 'opacity-60' : ''
      }`}
      data-product-id={product.id}
    >
      {/* Media */}
      <div className="relative overflow-hidden aspect-[3/4] bg-[#E8E6E1]">
        <Link
          to={`/products/${product.handle}`}
          prefetch="intent"
          className="block h-full"
        >
          {/* Primary image */}
          {product.featuredImage ? (
            <Image
              data={product.featuredImage}
              aspectRatio="3/4"
              sizes="(min-width: 1024px) 25vw, (min-width: 768px) 33vw, 50vw"
              loading={loading}
              className="w-full h-full object-cover transition-transform duration-[600ms] ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-[1.04]"
            />
          ) : (
            <Placeholder aspect="aspect-[3/4]" label={product.title} />
          )}

          {/* Secondary image (flip on hover) */}
          {hasSecondImage && (
            <Image
              data={product.images!.nodes[1]}
              aspectRatio="3/4"
              sizes="(min-width: 1024px) 25vw, (min-width: 768px) 33vw, 50vw"
              loading="lazy"
              className="absolute inset-0 w-full h-full object-cover opacity-0 transition-opacity duration-[400ms] ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:opacity-100"
            />
          )}
        </Link>

        {/* Badges top-left */}
        {(onSale || isNewTag || soldOut) && (
          <div className="absolute top-3 left-3 flex flex-col gap-1.5 z-10">
            {isNewTag && <Badge variant="new">New</Badge>}
            {onSale && <Badge variant="sale">Sale</Badge>}
            {soldOut && <Badge variant="soldout">Sold out</Badge>}
          </div>
        )}

        {/* Wishlist top-right */}
        <div className="absolute top-3 right-3 z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          <WishlistButton
            size="sm"
            className="bg-white/90 backdrop-blur-sm rounded-full p-1.5 text-[#1A1A1A] hover:text-[#FF3B30]"
            product={{
              id: product.id,
              handle: product.handle,
              title: product.title,
              price: product.priceRange.minVariantPrice.amount,
              image: product.featuredImage?.url,
            }}
          />
        </div>

        {/* Quick add — slides up on hover */}
        {showQuickAdd && product.availableForSale && (
          <div className="absolute bottom-0 left-0 right-0 translate-y-full opacity-0 transition-all duration-[300ms] ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:translate-y-0 group-hover:opacity-100 z-10 p-3">
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                onQuickAdd?.(product.id);
              }}
              className="w-full justify-center bg-[#1A1A1A] text-white text-caps py-3 hover:bg-[#FF3B30] transition-colors duration-200 rounded-full"
              aria-label={`Quick add ${product.title}`}
            >
              Quick add
            </button>
          </div>
        )}
      </div>

      {/* Info */}
      <div className="flex flex-col gap-1 px-0.5">
        {showVendor && product.vendor && (
          <div className="text-eyebrow text-[10px]">
            {product.vendor}
          </div>
        )}
        <div className="flex items-start justify-between gap-2">
          <Link
            to={`/products/${product.handle}`}
            prefetch="intent"
            className="font-serif text-base leading-snug hover:text-[#6B6B6B] transition-colors"
          >
            {product.title}
          </Link>
          <Money
            data={product.priceRange.minVariantPrice}
            className="font-serif text-base text-[#1A1A1A] shrink-0"
          />
        </div>
      </div>
    </article>
  );
}
