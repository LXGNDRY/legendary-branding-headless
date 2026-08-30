import {Link} from 'react-router';
import {Image} from '@shopify/hydrogen';
import Placeholder from '~/components/ui/Placeholder';

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

interface CollectionGridProps {
  eyebrow?: string;
  heading: string;
  linkLabel?: string;
  linkUrl?: string;
  collections: CollectionNode[];
  columns?: 2 | 3 | 4;
}

/**
 * HANSSEN — Collection Grid Section
 * Editorial collection cards with image + serif title beneath.
 * No hover overlay — clean Hanssen aesthetic with subtle zoom.
 */
export default function CollectionGrid({
  eyebrow = 'Shop by category',
  heading,
  linkLabel = 'View all',
  linkUrl = '/collections',
  collections,
  columns = 3,
}: CollectionGridProps) {
  const gridCols: Record<number, string> = {
    2: 'grid-cols-1 sm:grid-cols-2',
    3: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-4',
  };

  return (
    <section className="h-section bg-[var(--color-background)] h-reveal">
      <div className="h-container">
        <div className="h-section-header">
          <div>
            <p className="h-eyebrow mb-3">{eyebrow}</p>
            <h2 className="text-[clamp(2rem,4vw,3.5rem)] leading-[1.05] font-serif font-normal">
              {heading}
            </h2>
          </div>
          {linkLabel && linkUrl && (
            <Link to={linkUrl} className="h-link">
              {linkLabel}
            </Link>
          )}
        </div>

        <div className={`grid gap-8 ${gridCols[columns]}`}>
          {collections.map((collection) => {
            const productCount = collection.products?.nodes.length ?? 0;
            return (
              <Link
                key={collection.id}
                to={`/collections/${collection.handle}`}
                prefetch="intent"
                className="group block"
              >
                <div className="relative overflow-hidden rounded-lg aspect-[3/4] bg-[var(--color-surface)] mb-4">
                  {collection.image ? (
                    <Image
                      data={collection.image}
                      aspectRatio="3/4"
                      width={600}
                      height={800}
                      sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                      loading="lazy"
                      className="w-full h-full object-cover transition-transform duration-[600ms] ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-[1.03]"
                    />
                  ) : (
                    <Placeholder aspect="aspect-[3/4]" label={collection.title} />
                  )}
                </div>

                <div className="flex items-end justify-between">
                  <div>
                    <h3 className="text-[clamp(1.25rem,2vw,1.75rem)] font-serif leading-tight">
                      {collection.title}
                    </h3>
                    <p className="h-eyebrow mt-1">
                      {productCount} {productCount === 1 ? 'item' : 'items'}
                    </p>
                  </div>
                  {/* Always visible on devices that can't hover (any touch
                      device, regardless of viewport width); reveals on hover
                      only for devices with an actual fine pointer, matching
                      the ProductCard Quick Add/Wishlist pattern. */}
                  <span className="h-eyebrow opacity-100 [@media(hover:hover)_and_(pointer:fine)]:opacity-0 [@media(hover:hover)_and_(pointer:fine)]:group-hover:opacity-100 transition-opacity duration-300">
                    Shop →
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
