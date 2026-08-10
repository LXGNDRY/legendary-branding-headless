import {Link, useFetcher} from 'react-router';
import {Image, Money} from '@shopify/hydrogen';
import type {CurrencyCode} from '@shopify/hydrogen/storefront-api-types';
import Badge from '~/components/ui/Badge';
import Button from '~/components/ui/Button';
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
      url
      altText
      width
      height
    }
    images(first: 2) {
      nodes {
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
  const price = parseFloat(product.priceRange.minVariantPrice.amount);
  const compareAt = parseFloat(
    product.compareAtPriceRange.minVariantPrice.amount,
  );
  return compareAt > 0 && compareAt > price;
}

function isNew(product: ProductCardFragment) {
  // Products tagged 'new' or published within the last 14 days
  // (date-based check is done at query level; tag-based here)
  return product.tags.includes('new');
}

export default function ProductCard({
  product,
  loading,
  showVendor = false,
  showQuickAdd = true,
  hoverFlip = true,
  onQuickAdd,
}: {
  product: ProductCardFragment;
  loading?: 'eager' | 'lazy';
  showVendor?: boolean;
  showQuickAdd?: boolean;
  hoverFlip?: boolean;
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

  return (
    <article
      className={`group flex flex-col gap-3 cursor-pointer ${
        soldOut ? 'opacity-90' : ''
      }`}
      data-product-id={product.id}
    >
      {/* Media */}
      <Link
        to={`/products/${product.handle}`}
        prefetch="intent"
        className="relative overflow-hidden aspect-[3/4] bg-[#f5f5f5]"
      >
        {/* Primary image */}
        {product.featuredImage ? (
          <Image
            data={product.featuredImage}
            aspectRatio="3/4"
            sizes="(min-width: 1024px) 25vw, (min-width: 768px) 33vw, 50vw"
            loading={loading}
            className="w-full h-full object-cover transition-transform duration-[600ms] ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-[1.03]"
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
            className="absolute inset-0 w-full h-full object-cover opacity-0 transition-opacity duration-[300ms] ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:opacity-100"
          />
        )}

        {/* Badge overlays — split layout: left/right */}
        {(soldOut || onSale || isNewTag) && (
          <div className="absolute top-3 left-3 right-3 flex justify-between pointer-events-none z-10">
            <div className="flex gap-1.5 flex-wrap">
              {onSale && <Badge variant="sale">Sale</Badge>}
              {isNewTag && <Badge variant="new">New</Badge>}
            </div>
            {soldOut && <Badge variant="soldout">Sold out</Badge>}
          </div>
        )}

        {/* Quick add — slides up on hover */}
        {showQuickAdd && product.availableForSale && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 translate-y-2.5 opacity-0 transition-all duration-[300ms] ease-[cubic-bezier(0.16,1,0.3,1)] pointer-events-none w-[calc(100%-32px)] group-hover:opacity-100 group-hover:translate-y-0 group-hover:pointer-events-auto">
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                onQuickAdd?.(product.id);
              }}
              className="w-full justify-center bg-black text-white border border-black text-[0.78rem] font-medium tracking-[0.08em] uppercase py-2.5 hover:opacity-90 transition-opacity"
              aria-label={`Quick add ${product.title}`}
            >
              Quick add
            </button>
          </div>
        )}
      </Link>

      {/* Info */}
      <div className="flex flex-col gap-0.5 px-1">
        {showVendor && product.vendor && (
          <div className="text-[0.78rem] text-black/50 uppercase tracking-[0.08em]">
            {product.vendor}
          </div>
        )}
        <Link
          to={`/products/${product.handle}`}
          prefetch="intent"
          className="text-[0.85rem] font-medium leading-tight tracking-[0.02em] hover:opacity-70 transition-opacity"
        >
          {product.title}
        </Link>
        <div className="flex gap-2 items-baseline text-[0.85rem] font-medium">
          <Money
            data={product.priceRange.minVariantPrice}
            className="text-black"
          />
          {onSale && (
            <Money
              data={product.compareAtPriceRange.minVariantPrice}
              className="text-black/40 line-through font-normal text-[0.78rem]"
            />
          )}
        </div>
      </div>
    </article>
  );
}
