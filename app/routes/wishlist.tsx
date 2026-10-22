import {useFetcher, type MetaFunction} from 'react-router';
import Container from '~/components/ui/Container';
import Button from '~/components/ui/Button';
import {useWishlist} from '~/components/ui/Wishlist';
import ProductCard from '~/components/ui/ProductCard';
import {useEffect, useState} from 'react';
import type {ProductCardFragment} from '~/components/ui/ProductCard';
import {ROUTES, canonicalUrl} from '~/lib/site';

export const meta: MetaFunction = () => {
  const canonical = canonicalUrl(ROUTES.wishlist);
  return [
    {title: 'Wishlist | LEGENDARY BRANDING'},
    {name: 'description', content: 'Your saved items from Legendary Branding.'},
    {tagName: 'link', rel: 'canonical', href: canonical},
    {property: 'og:title', content: 'Wishlist | LEGENDARY BRANDING'},
    {property: 'og:description', content: 'Your saved items from Legendary Branding.'},
    {property: 'og:url', content: canonical},
  ];
};

/**
 * Wishlist page — displays all items saved by the user.
 *
 * The saved list holds product identity only; every card is rendered from live
 * Storefront API data in the active market. Deleted, unpublished or
 * market-unavailable products are shown honestly with a way to remove them.
 */
export default function WishlistPage() {
  const {items, count, clear, remove, syncStatus} = useWishlist();
  const [mounted, setMounted] = useState(false);
  const products = useFetcher<{products?: Record<string, ProductCardFragment | null>; error?: string}>();

  useEffect(() => {
    setMounted(true);
  }, []);

  const idsKey = items.map((item) => item.id).join(',');
  const loadProducts = products.load;
  useEffect(() => {
    if (!mounted || !idsKey) return;
    loadProducts(`/api/wishlist-products?ids=${encodeURIComponent(idsKey)}`);
  }, [mounted, idsKey, loadProducts]);

  const liveProducts = products.data?.products ?? null;
  const loadFailed = Boolean(products.data?.error);
  const loading = !mounted || (count > 0 && !liveProducts && !loadFailed);

  return (
    <Container className="py-12">
      <header className="mb-10">
        <p className="h-eyebrow mb-3">WISHLIST</p>
        <div className="flex items-end justify-between flex-wrap gap-4">
          <h1 className="font-serif text-3xl md:text-4xl font-normal">
            Saved Items
          </h1>
          {mounted && count > 0 && (
            <button
              type="button"
              onClick={clear}
              className="text-xs font-medium tracking-widest uppercase text-[var(--color-text-secondary)] hover:text-[var(--color-accent)] transition-colors"
            >
              Clear all
            </button>
          )}
        </div>
        {mounted && (
          <p className="text-sm text-[var(--color-text-secondary)] mt-2">
            {count} {count === 1 ? 'item' : 'items'} saved
          </p>
        )}
        {mounted && syncStatus === 'error' && (
          <p role="alert" className="text-sm text-[var(--color-error)] mt-2">
            We couldn&apos;t sync your wishlist with your account right now. We&apos;ll keep retrying; your changes stay on this page.
          </p>
        )}
      </header>

      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-5" aria-busy="true">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="space-y-3">
              <div className="aspect-[3/4] bg-[var(--color-surface)] animate-pulse" />
              <div className="space-y-1.5">
                <div className="h-4 w-3/4 bg-[var(--color-surface)] animate-pulse" />
                <div className="h-3 w-1/3 bg-[var(--color-surface)] animate-pulse" />
              </div>
            </div>
          ))}
        </div>
      ) : count === 0 ? (
        <div className="py-20 text-center">
          <div className="inline-block mb-6">
            <svg viewBox="0 0 24 24" className="w-16 h-16 text-[var(--color-text-tertiary)]" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
            </svg>
          </div>
          <h2 className="font-serif text-2xl font-normal mb-3">
            Your wishlist is empty
          </h2>
          <p className="text-sm text-[var(--color-text-secondary)] mb-8 max-w-md mx-auto">
            Save items you love by clicking the heart icon on any product.
            Come back anytime to pick up where you left off.
          </p>
          <Button as="link" to="/collections/all-products" variant="primary">
            Shop All Products
          </Button>
        </div>
      ) : loadFailed ? (
        <div role="alert" className="py-16 text-center">
          <p className="text-sm text-[var(--color-text-secondary)] mb-6">
            We couldn&apos;t load your saved items right now.
          </p>
          <Button
            variant="outline"
            onClick={() => loadProducts(`/api/wishlist-products?ids=${encodeURIComponent(idsKey)}`)}
          >
            Try again
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-5">
          {items.map((item) => {
            // NOTE: the API answers every requested id (null = unavailable), so an id missing from the
            // map has simply not been requested yet and must not be shown as unavailable.
            const known = liveProducts !== null && item.id in liveProducts;
            const product = known ? liveProducts![item.id] : null;
            return (
              <div key={item.id} className="relative group">
                {!known ? (
                  <div className="space-y-3" aria-busy="true">
                    <div className="aspect-[3/4] bg-[var(--color-surface)] animate-pulse" />
                    <div className="h-4 w-3/4 bg-[var(--color-surface)] animate-pulse" />
                  </div>
                ) : product ? (
                  <>
                    <button
                      type="button"
                      onClick={() => remove(item.handle)}
                      className="absolute top-2 right-2 z-20 bg-[var(--color-bg-level-2)]/90 text-[var(--color-text-secondary)] hover:text-[var(--color-accent)] p-1.5 opacity-100 [@media(hover:hover)_and_(pointer:fine)]:opacity-0 [@media(hover:hover)_and_(pointer:fine)]:group-hover:opacity-100 focus-visible:opacity-100 transition-opacity"
                      aria-label={`Remove ${product.title} from wishlist`}
                    >
                      <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <line x1="18" y1="6" x2="6" y2="18" />
                        <line x1="6" y1="6" x2="18" y2="18" />
                      </svg>
                    </button>
                    <ProductCard product={product} />
                  </>
                ) : (
                  <div className="aspect-[3/4] flex flex-col items-center justify-center gap-3 border border-[var(--color-border-muted)] bg-[var(--color-surface)] p-4 text-center">
                    <p className="text-sm text-[var(--color-text-secondary)]">
                      This item is no longer available in your region.
                    </p>
                    <button
                      type="button"
                      onClick={() => remove(item.handle)}
                      className="text-xs font-medium tracking-widest uppercase text-[var(--color-text-primary)] underline underline-offset-4"
                    >
                      Remove
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </Container>
  );
}
