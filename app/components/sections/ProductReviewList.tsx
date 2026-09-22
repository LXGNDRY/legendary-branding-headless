import {useState} from 'react';
import type {JudgemeReview} from '~/lib/judgeme';
import {StarIcon} from '~/components/ui/StarRating';
import Button from '~/components/ui/Button';

interface ProductReviewListProps {
  reviews: JudgemeReview[];
  aggregateRating?: number;
  aggregateCount?: number;
}

const PAGE_SIZE = 6;

/**
 * Real per-product Judge.me reviews, rendered by us instead of Judge.me's
 * own widget markup/script -- see fetchJudgemeProductReviews for why.
 * Renders nothing if there are no reviews to show (aggregate rating alone,
 * with no review text, has nowhere useful to render here).
 *
 * Paginated client-side (a plain "Show more" reveal, not page numbers):
 * the full list is already fetched server-side in one shot, so there's no
 * further data to request -- this is purely about not dumping dozens of
 * review cards onto the page at once and forcing a long scroll.
 */
export default function ProductReviewList({
  reviews,
  aggregateRating,
  aggregateCount,
}: ProductReviewListProps) {
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  if (!reviews.length) return null;

  const visibleReviews = reviews.slice(0, visibleCount);
  const hasMore = visibleCount < reviews.length;

  return (
    <div>
      {aggregateRating != null && aggregateCount ? (
        <div className="flex items-center gap-3 mb-8">
          <div
            className="flex gap-0.5 text-[var(--color-accent)]"
            role="img"
            aria-label={`Average rating ${aggregateRating.toFixed(1)} out of 5 stars`}
          >
            {Array.from({length: 5}).map((_, i) => (
              <StarIcon key={i} filled={i < Math.round(aggregateRating)} />
            ))}
          </div>
          <p className="text-sm text-[var(--color-text-secondary)]">
            {aggregateRating.toFixed(2)} out of 5 · Based on {aggregateCount}{' '}
            {aggregateCount === 1 ? 'review' : 'reviews'}
          </p>
        </div>
      ) : null}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {visibleReviews.map((review) => (
          <div
            key={review.id}
            className="p-6 border border-[var(--color-border-muted)] rounded-lg bg-[var(--color-bg-level-0)]"
          >
            <div
              className="flex gap-0.5 mb-3 text-[var(--color-accent)]"
              role="img"
              aria-label={`${review.rating.toFixed(1)} out of 5 stars`}
            >
              {Array.from({length: 5}).map((_, i) => (
                <StarIcon key={i} filled={i < Math.round(review.rating)} />
              ))}
            </div>
            {review.title && (
              <p className="font-medium text-[var(--color-text-primary)] mb-2">
                {review.title}
              </p>
            )}
            <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed mb-4">
              &quot;{review.body}&quot;
            </p>
            <p className="text-xs font-medium text-[var(--color-text-tertiary)] uppercase tracking-wide">
              {review.reviewerName}
            </p>
          </div>
        ))}
      </div>

      {hasMore && (
        <div className="flex justify-center mt-8">
          <Button
            as="button"
            variant="outline"
            onClick={() => setVisibleCount((v) => v + PAGE_SIZE)}
          >
            Show more reviews ({reviews.length - visibleCount} more)
          </Button>
        </div>
      )}
    </div>
  );
}
