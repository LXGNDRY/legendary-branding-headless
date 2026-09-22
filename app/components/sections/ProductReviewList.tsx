import type {JudgemeReview} from '~/lib/judgeme';
import {StarIcon} from '~/components/ui/StarRating';

interface ProductReviewListProps {
  reviews: JudgemeReview[];
  aggregateRating?: number;
  aggregateCount?: number;
}

/**
 * Real per-product Judge.me reviews, rendered by us instead of Judge.me's
 * own widget markup/script -- see fetchJudgemeProductReviews for why.
 * Renders nothing if there are no reviews to show (aggregate rating alone,
 * with no review text, has nowhere useful to render here).
 */
export default function ProductReviewList({
  reviews,
  aggregateRating,
  aggregateCount,
}: ProductReviewListProps) {
  if (!reviews.length) return null;

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
        {reviews.map((review) => (
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
    </div>
  );
}
