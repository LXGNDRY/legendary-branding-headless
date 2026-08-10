import {
  type LoaderFunctionArgs,
  type ActionFunctionArgs,
  type MetaFunction,
  useLoaderData,
  Link,
} from 'react-router';
import {useState} from 'react';
import {
  CartForm,
  Image,
  Money,
  VariantSelector,
  getSelectedProductOptions,
  useOptimisticVariant,
  type VariantOption,
} from '@shopify/hydrogen';
import type {CurrencyCode} from '@shopify/hydrogen/storefront-api-types';
import Container from '~/components/ui/Container';
import Button from '~/components/ui/Button';
import Badge from '~/components/ui/Badge';
import Placeholder from '~/components/ui/Placeholder';
import ProductGallery from '~/components/ui/ProductGallery';
import JsonLd from '~/components/ui/JsonLd';
import SizeGuideModal from '~/components/ui/SizeGuideModal';
import WaitlistForm from '~/components/ui/WaitlistForm';
import RecentlyViewed from '~/components/ui/RecentlyViewed';
import ProductCard, {
  PRODUCT_CARD_FRAGMENT,
  type ProductCardFragment,
} from '~/components/ui/ProductCard';
import {CacheLong} from '~/lib/cache';

type MoneyData = {amount: string; currencyCode: CurrencyCode};

type ProductVariantFragment = {
  id: string;
  availableForSale: boolean;
  quantityAvailable?: number | null;
  selectedOptions: {name: string; value: string}[];
  price: MoneyData;
  compareAtPrice?: MoneyData | null;
  image?: {
    url: string;
    altText?: string | null;
    width?: number | null;
    height?: number | null;
  } | null;
};

type ProductFull = {
  id: string;
  title: string;
  handle: string;
  descriptionHtml: string;
  tags: string[];
  vendor: string;
  metafields: {
    nodes: Array<{
      key: string;
      value: string;
      type: string;
    }>;
  };
  images: {
    nodes: {
      id?: string | null;
      url: string;
      altText?: string | null;
      width?: number | null;
      height?: number | null;
    }[];
  };
  options: {
    id?: string;
    name: string;
    optionValues: {name: string}[];
  }[];
  selectedVariant?: ProductVariantFragment | null;
  variants: {
    nodes: ProductVariantFragment[];
  };
};

const PRODUCT_VARIANT_FRAGMENT = `#graphql
  fragment ProductVariant on ProductVariant {
    id
    availableForSale
    quantityAvailable
    selectedOptions { name value }
    price { amount currencyCode }
    compareAtPrice { amount currencyCode }
    image { url altText width height }
  }
` as const;

const PRODUCT_QUERY = `#graphql
  ${PRODUCT_VARIANT_FRAGMENT}
  ${PRODUCT_CARD_FRAGMENT}
  query Product(
    $handle: String!
    $selectedOptions: [SelectedOptionInput!]!
    $country: CountryCode
    $language: LanguageCode
  ) @inContext(country: $country, language: $language) {
    product(handle: $handle) {
      id
      title
      handle
      descriptionHtml
      tags
      vendor
      metafields(identifiers: [
        {namespace: "custom", key: "material"}
        {namespace: "custom", key: "fit"}
        {namespace: "custom", key: "care"}
        {namespace: "custom", key: "size_chart"}
      ]) {
        key
        value
        type
      }
      images(first: 10) {
        nodes { id url altText width height }
      }
      options {
        id
        name
        optionValues { name }
      }
      selectedVariant: variantBySelectedOptions(
        selectedOptions: $selectedOptions
        ignoreUnknownOptions: true
        caseInsensitiveMatch: true
      ) {
        ...ProductVariant
      }
      variants(first: 100) {
        nodes { ...ProductVariant }
      }
    }
    relatedProducts: collection(handle: "all-products") {
      products(first: 4, sortKey: BEST_SELLING) {
        nodes { ...ProductCard }
      }
    }
  }
` as const;

export const meta: MetaFunction<typeof loader> = ({data, location}) => {
  const product = data?.product;
  const description = product?.descriptionHtml
    ? product.descriptionHtml.replace(/<[^>]+>/g, '').slice(0, 155)
    : `Shop ${product?.title ?? 'this product'} at Legendary Branding.`;
  const ogImage = product?.images?.nodes?.[0]?.url ?? '';
  const canonical = `https://legendary-branding.com${location.pathname}`;

  return [
    {title: `${product?.title ?? 'Product'} — LEGENDARY BRANDING`},
    {name: 'description', content: description},
    {tagName: 'link', rel: 'canonical', href: canonical},
    {property: 'og:type', content: 'product'},
    {property: 'og:title', content: `${product?.title ?? 'Product'} — LEGENDARY BRANDING`},
    {property: 'og:description', content: description},
    ...(ogImage ? [{property: 'og:image', content: `${ogImage}&width=1200&height=1200`}] : []),
    {property: 'og:url', content: canonical},
    {name: 'twitter:card', content: 'summary_large_image'},
    {name: 'twitter:title', content: product?.title ?? 'Product'},
    {name: 'twitter:description', content: description},
    ...(ogImage ? [{name: 'twitter:image', content: `${ogImage}&width=1200&height=630`}] : []),
  ];
};

export async function action({request, context}: ActionFunctionArgs) {
  const {cart} = context;
  const formData = await request.formData();
  const {action, inputs} = CartForm.getFormInput(formData);

  if (action === CartForm.ACTIONS.LinesAdd) {
    const result = await cart.addLines(
      inputs.lines as Parameters<typeof cart.addLines>[0],
    );
    const headers = cart.setCartId(result.cart.id);
    return new Response(null, {status: 200, headers});
  }

  return new Response('Bad request', {status: 400});
}

export async function loader({params, request, context}: LoaderFunctionArgs) {
  const {handle} = params;
  if (!handle) throw new Response('Not Found', {status: 404});

  const selectedOptions = getSelectedProductOptions(request);

  const {product, relatedProducts} = await context.storefront.query(
    PRODUCT_QUERY,
    {
      variables: {
        handle,
        selectedOptions,
        country: context.storefront.i18n.country,
        language: context.storefront.i18n.language,
      },
      cache: CacheLong(),
    },
  );

  if (!product) throw new Response('Product not found', {status: 404});

  return {product: product as ProductFull, relatedProducts};
}

function AddToCartButton({
  variant,
  quantity = 1,
  buyNow = false,
}: {
  variant?: ProductVariantFragment | null;
  quantity?: number;
  buyNow?: boolean;
}) {
  const soldOut = !variant?.availableForSale;
  const unavailable = !variant;

  if (soldOut || unavailable) {
    return (
      <Button
        variant="outline"
        type="button"
        className="w-full py-4 text-sm opacity-60 cursor-not-allowed"
        disabled
      >
        {unavailable ? 'Select Options' : 'Sold Out'}
      </Button>
    );
  }

  return (
    <CartForm
      route="/cart"
      action={CartForm.ACTIONS.LinesAdd}
      inputs={{
        lines: [
          {
            merchandiseId: variant.id,
            quantity,
          },
        ],
      }}
    >
      <button
        type="submit"
        className={`w-full py-4 text-sm font-semibold tracking-widest uppercase transition-all duration-300 ${
          buyNow
            ? 'border-2 border-black bg-white text-black hover:bg-black hover:text-white'
            : 'bg-black text-white hover:bg-[#333]'
        }`}
      >
        {buyNow ? 'Buy Now' : 'Add to Cart'}
      </button>
    </CartForm>
  );
}

function QuantitySelector({
  value,
  onChange,
}: {
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <div className="flex items-center border border-black/10">
      <button
        type="button"
        onClick={() => onChange(Math.max(1, value - 1))}
        className="w-10 h-10 flex items-center justify-center hover:bg-[#f7f7f7] transition-colors disabled:opacity-40"
        aria-label="Decrease quantity"
        disabled={value <= 1}
      >
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M2 7h10" />
        </svg>
      </button>
      <span className="w-10 text-center text-sm font-medium">{value}</span>
      <button
        type="button"
        onClick={() => onChange(value + 1)}
        className="w-10 h-10 flex items-center justify-center hover:bg-[#f7f7f7] transition-colors"
        aria-label="Increase quantity"
      >
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M7 2v10M2 7h10" />
        </svg>
      </button>
    </div>
  );
}

export default function ProductPage() {
  const {product, relatedProducts} = useLoaderData<typeof loader>();
  const [sizeGuideOpen, setSizeGuideOpen] = useState(false);
  const [quantity, setQuantity] = useState(1);

  const selectedVariant = useOptimisticVariant(
    product.selectedVariant as ProductVariantFragment | undefined,
    product.variants.nodes as ProductVariantFragment[],
  );

  const isOnSale =
    selectedVariant?.compareAtPrice &&
    parseFloat(selectedVariant.compareAtPrice.amount) >
      parseFloat(selectedVariant.price.amount);

  const isNew = product.tags.includes('new');

  const productJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.title,
    image: product.images.nodes.map((img) => img.url),
    description: product.descriptionHtml.replace(/<[^>]+>/g, ''),
    brand: {'@type': 'Brand', name: product.vendor || 'Legendary Branding'},
    offers: product.variants.nodes.map((v) => ({
      '@type': 'Offer',
      price: v.price.amount,
      priceCurrency: v.price.currencyCode,
      availability: v.availableForSale
        ? 'https://schema.org/InStock'
        : 'https://schema.org/OutOfStock',
      url: `https://legendary-branding.com/products/${product.handle}`,
    })),
  };

  return (
    <>
      <JsonLd data={productJsonLd} />
      <Container className="py-12">
        {/* Breadcrumb */}
        <nav
          className="mb-8 text-[11px] tracking-widest uppercase text-[#6b6b6b]"
          aria-label="Breadcrumb"
        >
          <Link to="/collections/all-products" className="hover:text-[#0a0a0a] transition-colors">
            Shop
          </Link>
          <span className="mx-2">/</span>
          {product.vendor && (
            <>
              <span className="text-[#6b6b6b]">{product.vendor}</span>
              <span className="mx-2">/</span>
            </>
          )}
          <span className="text-[#0a0a0a]">{product.title}</span>
        </nav>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 lg:gap-16">
          {/* Gallery */}
          <ProductGallery images={product.images.nodes} title={product.title} />

          {/* Product info */}
          <div className="space-y-6">
            {/* Title + price */}
            <div>
              {(isOnSale || isNew || !selectedVariant?.availableForSale) && (
                <div className="flex gap-2 mb-3">
                  {!selectedVariant?.availableForSale && (
                    <Badge variant="soldout">Sold Out</Badge>
                  )}
                  {isOnSale && <Badge variant="sale">Sale</Badge>}
                  {isNew && !isOnSale && <Badge variant="new">New</Badge>}
                </div>
              )}
              <h1 className="!text-[clamp(1.75rem,4vw,3rem)] !font-normal !leading-none mb-3">
                {product.title}
              </h1>
              <div className="flex items-baseline gap-3">
                {selectedVariant ? (
                  <>
                    <Money
                      data={selectedVariant.price}
                      className="text-lg font-medium"
                    />
                    {isOnSale && selectedVariant.compareAtPrice && (
                      <Money
                        data={selectedVariant.compareAtPrice}
                        className="text-sm text-black/40 line-through font-normal"
                      />
                    )}
                  </>
                ) : (
                  <span className="text-lg font-medium text-black/50">
                    Select a variant
                  </span>
                )}
              </div>
            </div>

            {/* Variant selector */}
            <VariantSelector
              handle={product.handle}
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              options={product.options as any}
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              variants={product.variants.nodes as any}
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              selectedVariant={selectedVariant as any}
            >
              {({option}: {option: VariantOption}) => (
                <div key={option.name} className="space-y-2">
                  <div className="flex items-center gap-2">
                    <p className="text-[0.65rem] font-semibold tracking-[0.15em] uppercase">
                      {option.name}
                    </p>
                    {option.name.toLowerCase() === 'size' && (
                      <button
                        type="button"
                        onClick={() => setSizeGuideOpen(true)}
                        className="text-[0.65rem] tracking-wide underline underline-offset-2 text-black/60 hover:text-black transition-colors"
                      >
                        Size Guide
                      </button>
                    )}
                  </div>
                  <div className="flex gap-2 flex-wrap">
                    {option.values.map(({value, isActive, isAvailable, to}) => (
                      <Link
                        key={value}
                        to={to}
                        replace
                        preventScrollReset
                        prefetch="intent"
                        className={`min-w-[3rem] h-10 px-3 border text-xs font-medium transition-colors flex items-center justify-center ${
                          isActive
                            ? 'border-black bg-black text-white'
                            : isAvailable
                              ? 'border-[#e5e5e5] hover:border-black text-black'
                              : 'border-[#e5e5e5] text-black/30 cursor-not-allowed line-through'
                        }`}
                        aria-disabled={!isAvailable}
                        aria-label={`${option.name}: ${value}${!isAvailable ? ' (unavailable)' : ''}`}
                      >
                        {value}
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </VariantSelector>

            {/* Sticky add to cart */}
            <div className="sticky bottom-0 pt-2 -mx-1 px-1 pb-1 bg-gradient-to-t from-white via-white/95 to-transparent">
              {/* Quantity selector */}
              {selectedVariant?.availableForSale && (
                <div className="flex items-center justify-between mb-4">
                  <span className="text-xs tracking-widest uppercase text-black/60">
                    Quantity
                  </span>
                  <QuantitySelector value={quantity} onChange={setQuantity} />
                </div>
              )}

              {/* Add to cart */}
              <AddToCartButton
                variant={selectedVariant as ProductVariantFragment | null | undefined}
                quantity={quantity}
              />

              {/* Buy Now */}
              {selectedVariant?.availableForSale && (
                <div className="mt-3">
                  <AddToCartButton
                    variant={selectedVariant as ProductVariantFragment}
                    quantity={quantity}
                    buyNow
                  />
                </div>
              )}

              {/* Waitlist for sold out */}
              {!selectedVariant?.availableForSale && selectedVariant && (
                <div className="mt-4">
                  <WaitlistForm
                    productTitle={product.title}
                    variantTitle={selectedVariant.selectedOptions
                      .map((o) => o.value)
                      .join(' / ')}
                  />
                </div>
              )}
            </div>

            {/* Description */}
            {product.descriptionHtml && (
              <div className="border-t border-black/10 pt-6">
                <p className="text-[0.65rem] font-semibold tracking-[0.15em] uppercase mb-4">
                  Description
                </p>
                <div
                  className="prose prose-sm max-w-none text-black [&_p]:text-sm [&_p]:leading-relaxed [&_p]:text-black/70 [&_ul]:text-sm [&_ul]:text-black/70 [&_li]:my-0.5"
                  // eslint-disable-next-line react/no-danger
                  dangerouslySetInnerHTML={{__html: product.descriptionHtml}}
                />
              </div>
            )}

            {/* Metafields: Material / Fit / Care */}
            {product.metafields && product.metafields.nodes && product.metafields.nodes.some((m: {value: string}) => m.value) && (
              <div className="border-t border-black/10 pt-6 space-y-4">
                {(product.metafields.nodes as Array<{key: string; value: string}>).map((mf) => {
                  if (!mf.value) return null;
                  const labels: Record<string, string> = {
                    material: 'Material',
                    fit: 'Fit',
                    care: 'Care Instructions',
                    size_chart: 'Size Chart',
                  };
                  return (
                    <div key={mf.key}>
                      <p className="text-[0.65rem] font-semibold tracking-[0.15em] uppercase mb-2">
                        {labels[mf.key] ?? mf.key}
                      </p>
                      <p className="text-sm text-black/70 leading-relaxed">{mf.value}</p>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Shipping note */}
            <div className="border-t border-[#e5e5e5] pt-4">
              <p className="text-[0.78rem] tracking-wide text-black/60">
                Free shipping on orders over $100 · Easy returns within 30 days
              </p>
            </div>
          </div>
        </div>
      </Container>

      {/* Related products */}
      {relatedProducts?.products?.nodes && relatedProducts.products.nodes.length > 0 && (
        <section className="bg-[#f5f5f5]">
          <Container className="py-20">
            <div className="flex items-baseline justify-between mb-10">
              <h2 className="text-[0.78rem] font-medium tracking-[0.15em] uppercase">
                You May Also Like
              </h2>
              <Button as="link" to="/collections/all-products" variant="ghost">
                View All
              </Button>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {(relatedProducts.products.nodes as ProductCardFragment[])
                .filter((p) => p.id !== product.id)
                .slice(0, 4)
                .map((p, i) => (
                  <ProductCard
                    key={p.id}
                    product={p}
                    loading={i < 2 ? 'eager' : 'lazy'}
                  />
                ))}
            </div>
          </Container>
        </section>
      )}

      {/* Recently viewed */}
      <RecentlyViewed
        currentProductId={product.id}
        currentProductHandle={product.handle}
        currentProductTitle={product.title}
        currentProductImage={product.images?.nodes?.[0]?.url}
      />

      {/* Size guide modal */}
      <SizeGuideModal
        open={sizeGuideOpen}
        onClose={() => setSizeGuideOpen(false)}
      />
    </>
  );
}
