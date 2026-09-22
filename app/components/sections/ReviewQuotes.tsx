import {useRevealChildren} from '~/hooks/useReveal';
import type {JudgemeQuote} from '~/lib/judgeme';
import {StarIcon} from '~/components/ui/StarRating';

interface ReviewQuotesProps {
  eyebrow?: string;
  heading?: string;
  quotes: JudgemeQuote[];
}

/**
 * Real Judge.me review quotes -- fetched server-side via the Judge.me API
 * (see app/lib/judgeme.ts). Reviewer names are truncated to first name +
 * last initial before they ever reach this component. Renders nothing if
 * there are no real quotes to show, rather than falling back to invented
 * copy.
 */
export default function ReviewQuotes({
  eyebrow = 'Customer Reviews',
  heading = 'The Culture Speaks',
  quotes,
}: ReviewQuotesProps) {
  const ref = useRevealChildren<HTMLDivElement>();
  if (!quotes.length) return null;

  return (
    <section className="h-section bg-[var(--color-bg-level-1)] border-t border-b border-[var(--color-border-muted)]">
      <div className="h-container">
        <div className="text-center mb-12">
          {eyebrow && <p className="h-eyebrow mb-3">{eyebrow}</p>}
          <h2 className="font-serif font-normal text-[clamp(1.75rem,3.5vw,2.75rem)] leading-[1.1] text-[var(--color-text-primary)]">
            {heading}
          </h2>
        </div>

        <div ref={ref} className="grid grid-cols-1 md:grid-cols-3 gap-6 h-stagger">
          {quotes.slice(0, 3).map((quote) => (
            <div
              key={quote.id}
              className="h-reveal p-6 md:p-8 bg-[var(--color-bg-level-0)] border border-[var(--color-border-muted)] rounded-lg"
            >
              <div className="flex gap-0.5 mb-4 text-[var(--color-accent)]">
                {Array.from({length: 5}).map((_, si) => (
                  <StarIcon key={si} filled={si < Math.round(quote.rating)} />
                ))}
              </div>

              <p className="text-[var(--color-text-secondary)] leading-relaxed mb-6 italic">
                &quot;{quote.body}&quot;
              </p>

              <div className="border-t border-[var(--color-border-muted)] pt-4">
                <p className="text-sm font-medium text-[var(--color-text-primary)]">
                  {quote.reviewerName}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
