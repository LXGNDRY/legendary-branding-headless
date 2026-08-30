import {Link, useFetcher} from 'react-router';
import {CartForm, Image, Money} from '@shopify/hydrogen';
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
  selectedOrFirstAvailableVariant?: {
    id: string;
    availableForSale: boolean;
  } | null;
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
    # Used by the product card's "Quick Add" button to add a variant to the
    # cart without navigating to the PDP. Falls back to the first available
    # variant when no options are pre-selected — correct for the common case
    # of single-variant products or a "just add the default" quick action.
    selectedOrFirstAvailableVariant(
      selectedOptions: []
      ignoreUnknownOptions: true
      caseInsensitiveMatch: true
    ) {
      id
      availableForSale
    }
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
 * ONYX x LEGENDARY — Product Card
 *
 * Premium dark theme product card. Large image, minimal UI.
 * - Image fills the card, 3/4 aspect
 * - Hover: subtle image zoom, secondary image crossfades
 * - Below image: title (serif) + price on same line
 * - Wishlist heart appears on hover
 */
export default function ProductCard({
  product,
  loading = 'lazy',
  showVendor = false,
  showQuickAdd = true,
  hoverFlip = true,
  layout = 'grid',
}: {
  product: ProductCardFragment;
  loading?: 'eager' | 'lazy';
  showVendor?: boolean;
  showQuickAdd?: boolean;
  hoverFlip?: boolean;
  layout?: 'grid' | 'list';
}) {
  const onSale = isOnSale(product);
  const soldOut = !product.availableForSale;
  const isNewTag = isNew(product);
  const hasSecondImage =
    hoverFlip &&
    product.images?.nodes &&
    product.images.nodes.length > 1 &&
    product.images.nodes[1];

  const quickAddVariant = product.selectedOrFirstAvailableVariant;
  const canQuickAdd = Boolean(quickAddVariant?.id && quickAddVariant.availableForSale);
  const quickAddFetcher = useFetcher<{errors?: Array<{message?: string}>}>();
  const isAdding = quickAddFetcher.state !== 'idle';
  const justAdded =
    quickAddFetcher.state === 'idle' &&
    quickAddFetcher.data != null &&
    !quickAddFetcher.data.errors?.length;

  function handleQuickAdd(e: React.MouseEvent) {
    e.preventDefault();
    if (!quickAddVariant?.id || isAdding) return;
    quickAddFetcher.submit(
      {
        [CartForm.INPUT_NAME]: JSON.stringify({
          action: CartForm.ACTIONS.LinesAdd,
          inputs: {lines: [{merchandiseId: quickAddVariant.id, quantity: 1}]},
        }),
      },
      {method: 'post', action: '/cart'},
    );
  }

  // List layout
  if (layout === 'list') {
    return (
      <article
        className={`group flex gap-6 border-b border-[var(--color-border-muted)] py-6 ${
          soldOut ? 'opacity-60' : ''
        }`}
        data-product-id={product.id}
      >
        {/* Media */}
        <Link
          to={`/products/${product.handle}`}
          prefetch="intent"
          className="relative overflow-hidden rounded-md w-28 h-36 md:w-36 md:h-48 shrink-0 bg-[var(--color-bg-level-2)]"
        >
          {product.featuredImage ? (
            <Image
              data={product.featuredImage}
              aspectRatio="3/4"
              width={800}
              height={1067}
              sizes="150px"
              loading={loading}
              className="w-full h-full object-cover transition-transform duration-500 ease-[var(--ease-expo)] group-hover:scale-105"
            />
          ) : (
            <Placeholder aspect="aspect-[3/4]" label={product.title} />
          )}
        </Link>

        {/* Info */}
        <div className="flex-1 flex flex-col justify-between py-1">
          <div>
            {showVendor && product.vendor && (
              <div className="h-eyebrow mb-1.5">
                {product.vendor}
              </div>
            )}
            <Link
              to={`/products/${product.handle}`}
              prefetch="intent"
              className="text-lg font-serif text-[var(--color-text-primary)] hover:text-[var(--color-accent)] transition-colors block mb-2"
            >
              {product.title}
            </Link>
            <p className="text-sm text-[var(--color-text-tertiary)] line-clamp-2 hidden md:block">
              {product.tags.slice(0, 3).join(' · ')}
            </p>
          </div>

          <div className="flex items-end justify-between">
            <div className="flex gap-2.5 items-baseline">
              <Money
                data={product.priceRange.minVariantPrice}
                className="text-lg font-serif text-[var(--color-text-primary)]"
              />
              {onSale && (
                <Money
                  data={product.compareAtPriceRange.minVariantPrice}
                  className="text-[var(--color-text-tertiary)] line-through font-normal text-sm"
                />
              )}
            </div>
            {showQuickAdd && product.availableForSale && (
              <Link
                to={`/products/${product.handle}`}
                className="h-eyebrow hover:text-[var(--color-accent)] transition-colors"
              >
                View →
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
      className={`group flex flex-col gap-3 ${
        soldOut ? 'opacity-60' : ''
      }`}
      data-product-id={product.id}
    >
      {/* Media */}
      <div className="relative overflow-hidden rounded-md aspect-[3/4] bg-[var(--color-bg-level-2)]">
        <Link
          to={`/products/${product.handle}`}
          prefetch="intent"
          className="block h-full"
          aria-label={product.title}
        >
          {/* Primary image */}
          {product.featuredImage ? (
            <Image
              data={product.featuredImage}
              aspectRatio="3/4"
              width={800}
              height={1067}
              sizes="(min-width: 1280px) 25vw, (min-width: 768px) 33vw, 50vw"
              loading={loading}
              className="w-full h-full object-cover transition-transform duration-[550ms] ease-[var(--ease-expo)] group-hover:scale-[1.03]"
            />
          ) : (
            <Placeholder aspect="aspect-[3/4]" label={product.title} />
          )}

          {/* Secondary image (crossfade on hover) */}
          {hasSecondImage && (
            <Image
              data={product.images!.nodes[1]}
              aspectRatio="3/4"
              width={800}
              height={1067}
              sizes="(min-width: 1280px) 25vw, (min-width: 768px) 33vw, 50vw"
              loading="lazy"
              className="absolute inset-0 w-full h-full object-cover opacity-0 transition-opacity duration-[350ms] ease-[var(--ease-expo)] group-hover:opacity-100"
            />
          )}
        </Link>

        {/* Badges top-left */}
        {(onSale || isNewTag || soldOut) && (
          <div className="absolute top-3 left-3 flex flex-col gap-1.5 z-10">
            {isNewTag && <Badge variant="new">New</Badge>}
            {onSale && <Badge variant="sale">Sale</Badge>}
            {soldOut && <Badge variant="soldout">Sold Out</Badge>}
          </div>
        )}

        {/* Wishlist top-right — always visible when the device can't hover
            (touch phones, but also touch tablets/landscape phones at wider
            viewports, which a `sm:` breakpoint alone would incorrectly hide
            again), hover-revealed only for fine-pointer devices that can
            actually trigger group-hover, to keep the card visually quiet
            until the user shows intent. */}
        <div className="absolute top-2.5 right-2.5 z-10 opacity-100 [@media(hover:hover)_and_(pointer:fine)]:opacity-0 [@media(hover:hover)_and_(pointer:fine)]:group-hover:opacity-100 transition-opacity duration-200">
          <WishlistButton
            size="sm"
            className="bg-[var(--color-bg-level-1)]/90 backdrop-blur-sm rounded-full p-1.5 text-[var(--color-text-primary)] hover:text-[var(--color-accent)] border border-[var(--color-border-muted)]"
            product={{
              id: product.id,
              handle: product.handle,
              title: product.title,
              price: product.priceRange.minVariantPrice.amount,
              image: product.featuredImage?.url,
            }}
          />
        </div>

        {/* Quick add — always visible on any device that can't hover
            (gated on hover/pointer capability, not viewport width, since a
            touch tablet or landscape phone can be wider than a `sm:`
            breakpoint and still have no way to trigger group-hover), slides
            up on hover only for devices with an actual fine pointer. */}
        {showQuickAdd && product.availableForSale && canQuickAdd && (
          <div className="absolute bottom-0 left-0 right-0 translate-y-0 opacity-100 transition-all duration-[300ms] ease-[var(--ease-expo)] [@media(hover:hover)_and_(pointer:fine)]:translate-y-full [@media(hover:hover)_and_(pointer:fine)]:opacity-0 [@media(hover:hover)_and_(pointer:fine)]:group-hover:translate-y-0 [@media(hover:hover)_and_(pointer:fine)]:group-hover:opacity-100 z-10 p-3">
            <button
              type="button"
              onClick={handleQuickAdd}
              disabled={isAdding}
              className="w-full justify-center bg-[var(--color-text-primary)] text-[var(--color-bg-level-0)] text-[0.7rem] font-semibold tracking-[0.12em] uppercase py-2.5 hover:bg-[var(--color-accent)] hover:text-white transition-colors duration-200 rounded-full disabled:opacity-60"
              aria-label={`Quick add ${product.title} to bag`}
            >
              {isAdding ? 'Adding…' : justAdded ? 'Added ✓' : 'Add to Bag'}
            </button>
          </div>
        )}
      </div>

      {/* Info */}
      <div className="flex flex-col gap-1 px-0.5">
        {showVendor && product.vendor && (
          <div className="h-eyebrow text-[10px]">
            {product.vendor}
          </div>
        )}
        <div className="flex items-start justify-between gap-3">
          <Link
            to={`/products/${product.handle}`}
            prefetch="intent"
            className="font-serif text-base leading-snug text-[var(--color-text-primary)] hover:text-[var(--color-accent)] transition-colors"
          >
            {product.title}
          </Link>
          <Money
            data={product.priceRange.minVariantPrice}
            className="font-serif text-base text-[var(--color-text-primary)] shrink-0"
          />
        </div>
      </div>
    </article>
  );
}
