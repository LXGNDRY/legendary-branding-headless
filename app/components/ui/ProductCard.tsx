import {Link} from 'react-router';
import {Image, Money} from '@shopify/hydrogen';
import type {CurrencyCode} from '@shopify/hydrogen/storefront-api-types';
import Badge from '~/components/ui/Badge';
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
  featuredImage?: {
    url: string;
    altText?: string | null;
    width?: number | null;
    height?: number | null;
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
    featuredImage {
      url
      altText
      width
      height
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

export default function ProductCard({
  product,
  loading,
}: {
  product: ProductCardFragment;
  loading?: 'eager' | 'lazy';
}) {
  const onSale = isOnSale(product);
  const soldOut = !product.availableForSale;
  const isNew = product.tags.includes('new');

  return (
    <Link
      to={`/products/${product.handle}`}
      prefetch="intent"
      className="group block"
    >
      <div className="relative overflow-hidden mb-3">
        {product.featuredImage ? (
          <Image
            data={product.featuredImage}
            aspectRatio="3/4"
            sizes="(min-width: 1024px) 25vw, (min-width: 768px) 33vw, 50vw"
            loading={loading}
            className="w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <Placeholder aspect="aspect-[3/4]" label={product.title} />
        )}

        {/* Badge overlay */}
        {(soldOut || onSale || isNew) && (
          <div className="absolute top-3 left-3">
            {soldOut ? (
              <Badge variant="soldout">Sold Out</Badge>
            ) : onSale ? (
              <Badge variant="sale">Sale</Badge>
            ) : isNew ? (
              <Badge variant="new">New</Badge>
            ) : null}
          </div>
        )}
      </div>

      <div className="space-y-1">
        <p className="text-xs font-medium tracking-[0.08em] uppercase truncate group-hover:text-[#6b6b6b] transition-colors">
          {product.title}
        </p>
        <div className="flex items-baseline gap-2">
          <Money
            data={product.priceRange.minVariantPrice}
            className="text-xs text-[#0a0a0a]"
          />
          {onSale && (
            <Money
              data={product.compareAtPriceRange.minVariantPrice}
              className="text-xs text-[#999999] line-through"
            />
          )}
        </div>
      </div>
    </Link>
  );
}
