import {
  type LoaderFunctionArgs,
  type ActionFunctionArgs,
  type MetaFunction,
  useLoaderData,
  useParams,
  Link,
} from 'react-router';
import {useState, useEffect} from 'react';
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
import Button from '~/components/ui/Button';
import Badge from '~/components/ui/Badge';
import ProductGallery from '~/components/ui/ProductGallery';
import JsonLd from '~/components/ui/JsonLd';
import {
  productSchema,
  breadcrumbSchema,
} from '~/components/seo/SeoSchema';
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
  image?: {url: string; altText?: string | null; width?: number | null; height?: number | null} | null;
};

type ProductFull = {
  id: string;
  title: string;
  handle: string;
  descriptionHtml: string;
  tags: string[];
  vendor: string;
  metafields: {
    nodes: Array<{key: string; value: string; type: string}>;
  };
  images: {
    nodes: {id?: string | null; url: string; altText?: string | null; width?: number | null; height?: number | null}[];
  };
  options: {id?: string; name: string; optionValues: {name: string}[]}[];
  selectedVariant?: ProductVariantFragment | null;
  variants: {nodes: ProductVariantFragment[]};
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
        {namespace: "judgeme", key: "badge"}
        {namespace: "judgeme", key: "widget"}
        {namespace: "reviews", key: "rating"}
        {namespace: "reviews", key: "rating_count"}
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
    {title: `${product?.title ?? 'Product'} | LEGENDARY BRANDING`},
    {name: 'description', content: description},
    {tagName: 'link', rel: 'canonical', href: canonical},
    {property: 'og:type', content: 'product'},
    {property: 'og:title', content: `${product?.title ?? 'Product'} | LEGENDARY BRANDING`},
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
  const {action: cartAction, inputs} = CartForm.getFormInput(formData);

  if (cartAction === CartForm.ACTIONS.LinesAdd) {
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
  const {product, relatedProducts} = await context.storefront.query(PRODUCT_QUERY, {
    variables: {handle, selectedOptions, country: context.storefront.i18n.country, language: context.storefront.i18n.language},
    cache: CacheLong(),
  });

  if (!product) throw new Response('Product not found', {status: 404});
  return {product: product as ProductFull, relatedProducts};
}

function AddToCartButton({variant, quantity = 1}: {variant?: ProductVariantFragment | null; quantity?: number}) {
  const soldOut = !variant?.availableForSale;
  const unavailable = !variant;

  if (soldOut || unavailable) {
    return (
      <button
        type="button"
        disabled
        className="w-full h-btn-primary opacity-40 cursor-not-allowed"
      >
        {unavailable ? 'Select Options' : 'Sold Out'}
      </button>
    );
  }

  return (
    <CartForm
      route="/cart"
      action={CartForm.ACTIONS.LinesAdd}
      inputs={{lines: [{merchandiseId: variant.id, quantity}]}}
    >
      <button type="submit" className="w-full h-btn-primary">
        Add to Bag
      </button>
    </CartForm>
  );
}

function QuantitySelector({value, onChange}: {value: number; onChange: (v: number) => void}) {
  return (
    <div className="flex items-center border border-[var(--color-border-medium)] rounded-md overflow-hidden bg-[var(--color-bg-level-2)]">
      <button
        type="button"
        onClick={() => onChange(Math.max(1, value - 1))}
        className="w-10 h-10 flex items-center justify-center text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-bg-level-3)] transition-colors disabled:opacity-40"
        aria-label="Decrease quantity"
        disabled={value <= 1}
      >
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" aria-hidden="true">
          <path d="M2 6h8" />
        </svg>
      </button>
      <span className="w-10 text-center text-sm font-medium text-[var(--color-text-primary)]">{value}</span>
      <button
        type="button"
        onClick={() => onChange(value + 1)}
        className="w-10 h-10 flex items-center justify-center text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-bg-level-3)] transition-colors"
        aria-label="Increase quantity"
      >
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" aria-hidden="true">
          <path d="M6 2v8M2 6h8" />
        </svg>
      </button>
    </div>
  );
}

function Accordion({label, children}: {label: string; children: React.ReactNode}) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-[var(--color-border-muted)]">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex items-center justify-between w-full py-4 text-left text-[var(--color-text-primary)]"
        aria-expanded={open}
      >
        <span className="h-eyebrow">{label}</span>
        <svg
          width="14"
          height="14"
          viewBox="0 0 14 14"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          className={`transition-transform duration-200 text-[var(--color-text-secondary)] ${open ? 'rotate-45' : ''}`}
          aria-hidden="true"
        >
          <path d="M7 2v10M2 7h10" />
        </svg>
      </button>
      {open && (
        <div className="pb-5 text-[0.875rem] text-[var(--color-text-secondary)] leading-relaxed">
          {children}
        </div>
      )}
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
    parseFloat(selectedVariant.compareAtPrice.amount) > parseFloat(selectedVariant.price.amount);

  const isNew = product.tags.includes('new');

  // Judge.me review metafields — populated by the Judge.me app's ongoing
  // sync into Shopify metafields; absent until a product has its first
  // review, so every usage below degrades gracefully to "no reviews yet".
  const judgemeBadgeHtml = product.metafields?.nodes?.find((m) => m.key === 'badge')?.value;
  const judgemeWidgetHtml = product.metafields?.nodes?.find((m) => m.key === 'widget')?.value;

  // Re-scan the DOM for Judge.me widgets after client-side navigation
  // between products — the widget_v3.js loader only auto-scans on a full
  // page load, so a fresh Storefront API rendered handle needs an explicit
  // rebuild call. jdgm.batchRebuildWidgets is Judge.me's documented
  // re-render entry point for this scenario.
  useEffect(() => {
    const jdgm = (window as unknown as {jdgm?: {batchRebuildWidgets?: () => void}}).jdgm;
    jdgm?.batchRebuildWidgets?.();
  }, [product.handle]);

  const productJsonLd = productSchema({
    id: product.id,
    title: product.title,
    handle: product.handle,
    description: product.descriptionHtml.replace(/<[^>]+>/g, ''),
    images: product.images.nodes.map((img) => img.url),
    vendor: product.vendor || undefined,
    variants: product.variants.nodes.map((v) => ({
      id: v.id,
      price: v.price.amount,
      currencyCode: v.price.currencyCode,
      available: v.availableForSale,
    })),
  });

  const breadcrumbJsonLd = breadcrumbSchema([
    {name: 'Shop', url: '/collections/all-products'},
    ...(product.vendor ? [{name: product.vendor}] : []),
    {name: product.title},
  ]);

  return (
    <>
      <JsonLd data={productJsonLd} />
      <JsonLd data={breadcrumbJsonLd} />
      <div className="bg-[var(--color-bg-level-0)]">
        <div className="h-container py-10 md:py-14">
          {/* Breadcrumb */}
          <nav className="h-eyebrow text-[var(--color-text-tertiary)] mb-8" aria-label="Breadcrumb">
            <Link to="/collections/all-products" className="hover:text-[var(--color-foreground)] transition-colors">
              Shop
            </Link>
            <span className="mx-2 opacity-40">/</span>
            {product.vendor && (
              <>
                <span>{product.vendor}</span>
                <span className="mx-2 opacity-40">/</span>
              </>
            )}
            <span className="text-[var(--color-foreground)]">{product.title}</span>
          </nav>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-10 lg:gap-16">
            {/* Gallery */}
            <ProductGallery images={product.images.nodes} title={product.title} />

            {/* Product info */}
            <div className="space-y-6">
              {/* Badges */}
              {(isOnSale || isNew || !selectedVariant?.availableForSale) && (
                <div className="flex gap-2">
                  {!selectedVariant?.availableForSale && <Badge variant="soldout">Sold Out</Badge>}
                  {isOnSale && <Badge variant="sale">Sale</Badge>}
                  {isNew && !isOnSale && <Badge variant="new">New</Badge>}
                </div>
              )}

              {/* Title + price */}
              <div>
                <h1 className="font-serif font-normal text-[clamp(1.75rem,3.5vw,2.75rem)] leading-[1.05] tracking-[-0.01em] text-[var(--color-text-primary)] mb-3">
                  {product.title}
                </h1>
                {judgemeBadgeHtml && (
                  // Judge.me's compact star-rating badge. Safe to render via
                  // dangerouslySetInnerHTML: this HTML is our own trusted
                  // Shopify metafield data synced server-side by the Judge.me
                  // app, not user-supplied content, and Judge.me's loader
                  // script requires this exact DOM structure to hydrate it.
                  <div
                    className="mb-2"
                    dangerouslySetInnerHTML={{__html: judgemeBadgeHtml}}
                  />
                )}
                <div className="flex items-baseline gap-3">
                  {selectedVariant ? (
                    <>
                      <Money data={selectedVariant.price} className="text-[1.1rem] font-medium text-[var(--color-text-primary)]" />
                      {isOnSale && selectedVariant.compareAtPrice && (
                        <Money data={selectedVariant.compareAtPrice} className="text-sm text-[var(--color-text-tertiary)] line-through font-normal" />
                      )}
                    </>
                  ) : (
                    <span className="text-[1.1rem] font-medium text-[var(--color-text-tertiary)]">Select a variant</span>
                  )}
                </div>
              </div>

              {/* Variant selector */}
              <VariantSelector
                handle={product.handle}
                options={product.options as Parameters<typeof VariantSelector>[0]['options']}
                variants={product.variants.nodes as Parameters<typeof VariantSelector>[0]['variants']}
                selectedVariant={selectedVariant as Parameters<typeof VariantSelector>[0]['selectedVariant']}
              >
                {({option}: {option: VariantOption}) => (
                  <div key={option.name} className="space-y-3">
                    <div className="flex items-center gap-3">
                      <p className="h-eyebrow text-[var(--color-text-primary)]">{option.name}</p>
                      {option.name.toLowerCase() === 'size' && (
                        <button
                          type="button"
                          onClick={() => setSizeGuideOpen(true)}
                          className="text-[11px] text-[var(--color-text-tertiary)] hover:text-[var(--color-accent)] underline underline-offset-2 transition-colors"
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
                          className={`min-w-[3rem] h-10 px-4 border text-[0.7rem] font-semibold tracking-[0.1em] uppercase transition-all duration-150 flex items-center justify-center rounded-md ${
                            isActive
                              ? 'border-[var(--color-text-primary)] bg-[var(--color-text-primary)] text-[var(--color-bg-level-0)]'
                              : isAvailable
                                ? 'border-[var(--color-border-medium)] text-[var(--color-text-primary)] hover:border-[var(--color-text-primary)] hover:bg-[var(--color-bg-level-2)]'
                                : 'border-[var(--color-border-muted)] text-[var(--color-text-tertiary)] cursor-not-allowed line-through opacity-50'
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

              {/* Quantity + Add to cart */}
              <div className="space-y-3 pt-2">
                {selectedVariant?.availableForSale && (
                  <div className="flex items-center justify-between">
                    <span className="h-eyebrow text-[var(--color-text-secondary)]">Quantity</span>
                    <QuantitySelector value={quantity} onChange={setQuantity} />
                  </div>
                )}
                <AddToCartButton
                  variant={selectedVariant as ProductVariantFragment | null | undefined}
                  quantity={quantity}
                />
                {!selectedVariant?.availableForSale && selectedVariant && (
                  <div className="mt-4">
                    <WaitlistForm
                      productTitle={product.title}
                      variantTitle={selectedVariant.selectedOptions.map((o) => o.value).join(' / ')}
                    />
                  </div>
                )}
              </div>

              {/* Shipping note */}
              <p className="h-eyebrow text-[var(--color-text-tertiary)] text-center">
                Free shipping over $150 · 30-day returns
              </p>

              {/* Accordions */}
              <div className="border-t border-[var(--color-border-muted)] pt-4">
                {product.descriptionHtml && (
                  <Accordion label="Description">
                    <div
                      className="prose prose-sm max-w-none [&_p]:text-[var(--color-text-secondary)] [&_ul]:text-[var(--color-text-secondary)]"
                      dangerouslySetInnerHTML={{__html: product.descriptionHtml}}
                    />
                  </Accordion>
                )}
                <Accordion label="Shipping & Returns">
                  <p>Free shipping on orders over $150. Orders ship within 3–5 business days. Easy 30-day returns on unworn items.</p>
                </Accordion>
                {product.metafields?.nodes?.some((m) => m.key === 'care' && m.value) && (
                  <Accordion label="Care Guide">
                    <p>{product.metafields.nodes.find((m) => m.key === 'care')?.value}</p>
                  </Accordion>
                )}
                {product.metafields?.nodes?.some((m) => m.key === 'material' && m.value) && (
                  <Accordion label="Material">
                    <p>{product.metafields.nodes.find((m) => m.key === 'material')?.value}</p>
                  </Accordion>
                )}
                {product.metafields?.nodes?.some((m) => m.key === 'fit' && m.value) && (
                  <Accordion label="Fit">
                    <p>{product.metafields.nodes.find((m) => m.key === 'fit')?.value}</p>
                  </Accordion>
                )}
                <Accordion label="Size Guide">
                  <button
                    type="button"
                    onClick={() => setSizeGuideOpen(true)}
                    className="h-link"
                  >
                    View full size guide →
                  </button>
                </Accordion>
              </div>
            </div>
          </div>
        </div>

        {/* Reviews */}
        {judgemeWidgetHtml && (
          <section className="border-t border-[var(--color-border-muted)]">
            <div className="h-container py-16">
              <p className="h-eyebrow mb-3">Reviews</p>
              <h2 className="font-serif font-normal text-[clamp(1.75rem,3vw,2.5rem)] leading-[1.1] text-[var(--color-text-primary)] mb-8">
                What Customers Are Saying
              </h2>
              {/* Judge.me's full review widget. Safe to render via
                  dangerouslySetInnerHTML: this HTML is our own trusted
                  Shopify metafield data synced server-side by the Judge.me
                  app, not user-supplied content, and Judge.me's loader
                  script requires this exact DOM structure to hydrate it. */}
              <div dangerouslySetInnerHTML={{__html: judgemeWidgetHtml}} />
            </div>
          </section>
        )}

        {/* Related products */}
        {relatedProducts?.products?.nodes && relatedProducts.products.nodes.length > 0 && (
          <section className="border-t border-[var(--color-border-muted)]">
            <div className="h-container py-16">
              <div className="flex items-end justify-between mb-10">
                <div>
                  <p className="h-eyebrow mb-3">More to explore</p>
                  <h2 className="font-serif font-normal text-[clamp(1.75rem,3vw,2.5rem)] leading-[1.1] text-[var(--color-text-primary)]">
                    You May Also Like
                  </h2>
                </div>
                <Button as="link" to="/collections/all-products" variant="ghost">
                  View All
                </Button>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {(relatedProducts.products.nodes as ProductCardFragment[])
                  .filter((p) => p.id !== product.id)
                  .slice(0, 4)
                  .map((p, i) => (
                    <ProductCard key={p.id} product={p} loading={i < 2 ? 'eager' : 'lazy'} hoverFlip showQuickAdd />
                  ))}
              </div>
            </div>
          </section>
        )}
      </div>

      {/* Recently viewed */}
      <RecentlyViewed
        currentProductId={product.id}
        currentProductHandle={product.handle}
        currentProductTitle={product.title}
        currentProductImage={product.images?.nodes?.[0]?.url}
      />

      {/* Size guide modal */}
      <SizeGuideModal open={sizeGuideOpen} onClose={() => setSizeGuideOpen(false)} />
    </>
  );
}

export function ErrorBoundary() {
  const params = useParams();

  return (
    <div className="py-24 md:py-32">
      <div className="max-w-xl mx-auto text-center px-4">
        <p className="h-eyebrow mb-6">404 - Not Found</p>
        <h1 className="font-serif text-[clamp(2.5rem,7vw,5rem)] leading-[0.95] mb-6 text-[var(--color-text-primary)]">
          Sold out.
        </h1>
        <p className="text-[var(--color-text-secondary)] text-base leading-relaxed mb-10">
          We couldn&apos;t find the product{params.handle ? ` "${params.handle}"` : ''} you&apos;re
          looking for. It might have sold out or been removed.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link to="/collections/all-products" className="h-btn-primary">
            Browse All Products
          </Link>
          <Link
            to="/"
            className="px-6 py-3 border border-[var(--color-foreground)] text-sm tracking-wide uppercase hover:bg-[var(--color-foreground)] hover:text-white transition-colors"
          >
            Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}
