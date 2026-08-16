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
  columns?: 2 | 3 | 4 | 5 | 6;
}

/**
 * LEGENDARY STREETWEAR — Collection Grid Section
 * Editorial collection cards with hover zoom and overlay.
 * Ported from sections/lb-collection-grid.liquid
 */
export default function CollectionGrid({
  eyebrow = 'EXPLORE',
  heading,
  linkLabel = 'View all collections',
  linkUrl = '/collections',
  collections,
  columns = 3,
}: CollectionGridProps) {
  const gridCols: Record<number, string> = {
    2: 'grid-cols-1 sm:grid-cols-2',
    3: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-4',
    5: 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-5',
    6: 'grid-cols-3 sm:grid-cols-4 lg:grid-cols-6',
  };

  return (
    <section className="lb-section">
      <div className="lb-container">
        <div className="lb-section-header">
          <div>
            <div className="lb-eyebrow mb-2">{eyebrow}</div>
            <h2>{heading}</h2>
          </div>
          {linkLabel && linkUrl && (
            <Link to={linkUrl} className="lb-section-header__link">
              {linkLabel}
            </Link>
          )}
        </div>

        <div className={`grid gap-6 ${gridCols[columns]}`}>
          {collections.map((collection) => {
            const productCount = collection.products?.nodes.length ?? 0;
            return (
              <Link
                key={collection.id}
                to={`/collections/${collection.handle}`}
                prefetch="intent"
                className="group relative block"
              >
                <div className="relative overflow-hidden aspect-[4/3] bg-[#f5f5f5]">
                  {collection.image ? (
                    <Image
                      data={collection.image}
                      aspectRatio="4/3"
                      sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                      loading="lazy"
                      className="w-full h-full object-cover transition-transform duration-[600ms] ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-105"
                    />
                  ) : (
                    <Placeholder aspect="aspect-[4/3]" label={collection.title} />
                  )}

                  {/* Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                  {/* Title overlay */}
                  <div className="absolute bottom-0 left-0 right-0 p-5 translate-y-2 opacity-0 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]">
                    <h3 className="text-white text-xl font-normal tracking-[0.05em] uppercase">
                      {collection.title}
                    </h3>
                    <p className="text-white/70 text-xs tracking-[0.1em] uppercase mt-1">
                      {productCount} {productCount === 1 ? 'item' : 'items'}
                    </p>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
