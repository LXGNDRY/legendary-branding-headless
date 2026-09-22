import {Link} from 'react-router';
import {Image} from '@shopify/hydrogen';

function StarIcon({filled = true}: {filled?: boolean}) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 14 14"
      fill={filled ? 'currentColor' : 'none'}
      stroke="currentColor"
      strokeWidth="1"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M7 1l1.8 3.6 4 .6-2.9 2.8.7 4-3.6-1.9L3.4 12l.7-4L1.2 5.2l4-.6L7 1z" />
    </svg>
  );
}

interface ProductRating {
  id: string;
  handle: string;
  title: string;
  rating: number;
  reviewCount: number;
  image?: {url: string; altText?: string | null; width?: number | null; height?: number | null} | null;
}

interface VerifiedReviewsProps {
  eyebrow?: string;
  heading?: string;
  aggregateRating: number;
  aggregateCount: number;
  products: ProductRating[];
}

/**
 * Real, aggregated Judge.me review data -- no invented quotes or customer
 * names. Renders nothing if there isn't yet enough synced review data to
 * show, rather than fabricating social proof.
 */
export default function VerifiedReviews({
  eyebrow = 'Customer Reviews',
  heading = 'Rated by the Culture',
  aggregateRating,
  aggregateCount,
  products,
}: VerifiedReviewsProps) {
  if (aggregateCount === 0 || products.length === 0) return null;

  return (
    <section className="h-section bg-[var(--color-bg-level-1)] border-t border-b border-[var(--color-border-muted)]">
      <div className="h-container">
        <div className="text-center mb-12">
          {eyebrow && <p className="h-eyebrow mb-3">{eyebrow}</p>}
          <h2 className="font-serif font-normal text-[clamp(1.75rem,3.5vw,2.75rem)] leading-[1.1] text-[var(--color-text-primary)] mb-5">
            {heading}
          </h2>
          <div className="flex items-center justify-center gap-2 text-[var(--color-accent)]">
            {Array.from({length: 5}).map((_, i) => (
              <StarIcon key={i} filled={i < Math.round(aggregateRating)} />
            ))}
          </div>
          <p className="text-sm text-[var(--color-text-secondary)] mt-3">
            {aggregateRating.toFixed(1)} out of 5 &middot; from {aggregateCount.toLocaleString()}{' '}
            {aggregateCount === 1 ? 'review' : 'reviews'}
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
          {products.map((product) => (
            <Link
              key={product.id}
              to={`/products/${product.handle}#reviews`}
              className="group block"
            >
              <div className="relative aspect-[3/4] overflow-hidden rounded-lg bg-[var(--color-bg-level-2)] mb-3">
                {product.image?.url ? (
                  <Image
                    data={product.image}
                    aspectRatio="3/4"
                    width={400}
                    height={533}
                    className="absolute inset-0 w-full h-full object-cover object-center transition-transform duration-500 ease-[var(--ease-expo)] group-hover:scale-[1.04]"
                    sizes="(max-width: 768px) 50vw, 25vw"
                    loading="lazy"
                  />
                ) : (
                  <div className="absolute inset-0 bg-[var(--color-bg-level-3)]" />
                )}
              </div>
              <p className="text-sm text-[var(--color-text-primary)] leading-snug truncate mb-1">
                {product.title}
              </p>
              <div className="flex items-center gap-1.5 text-[var(--color-accent)]">
                <div className="flex gap-0.5">
                  {Array.from({length: 5}).map((_, i) => (
                    <StarIcon key={i} filled={i < Math.round(product.rating)} />
                  ))}
                </div>
                <span className="text-xs text-[var(--color-text-tertiary)]">
                  ({product.reviewCount})
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
