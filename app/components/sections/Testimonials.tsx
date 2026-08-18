interface Testimonial {
  quote: string;
  name: string;
  location?: string;
  stars?: number;
}

interface TestimonialsProps {
  eyebrow?: string;
  heading?: string;
  items: Testimonial[];
}

function StarRating({count}: {count: number}) {
  return (
    <div className="flex gap-1 mb-5" aria-label={`${count} out of 5 stars`}>
      {Array.from({length: 5}).map((_, i) => (
        <svg
          key={i}
          width="14"
          height="14"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <polygon
            points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26"
            fill={i < count ? 'var(--color-accent)' : 'transparent'}
            stroke="var(--color-accent)"
            strokeWidth="1.5"
          />
        </svg>
      ))}
    </div>
  );
}

/**
 * HANSSEN — Testimonials Section
 * Editorial quote cards with serif typography, warm dark background.
 */
export default function Testimonials({
  eyebrow = 'Customer Reviews',
  heading,
  items,
}: TestimonialsProps) {
  if (!items.length) return null;

  return (
    <section className="h-section bg-[var(--color-foreground)] text-[var(--color-text-inverse)] h-reveal">
      <div className="h-container">
        <div className="h-section-header">
          <div>
            {eyebrow && (
              <p className="h-eyebrow mb-3 text-[var(--color-text-tertiary)]">{eyebrow}</p>
            )}
            {heading && (
              <h2 className="text-[clamp(2rem,4vw,3.5rem)] leading-[1.05] font-serif font-normal">
                {heading}
              </h2>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {items.map((t, i) => (
            <blockquote
              key={i}
              className="bg-[var(--color-surface-dark)] border border-[var(--color-border-medium)] p-8 flex flex-col gap-4"
            >
              {(t.stars ?? 5) > 0 && <StarRating count={t.stars ?? 5} />}
              <p className="text-[var(--color-text-inverse)]/80 text-base leading-relaxed flex-1 font-serif italic">
                &ldquo;{t.quote}&rdquo;
              </p>
              <footer className="pt-4 border-t border-[var(--color-border-medium)]">
                <cite className="text-[var(--color-text-inverse)] text-sm font-sans font-medium tracking-wide not-italic block">
                  {t.name}
                </cite>
                {t.location && (
                  <span className="block text-[var(--color-text-tertiary)] text-xs tracking-wide mt-1">
                    {t.location}
                  </span>
                )}
              </footer>
            </blockquote>
          ))}
        </div>
      </div>
    </section>
  );
}
