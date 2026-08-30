import {useRevealChildren} from '~/hooks/useReveal';

interface TestimonialItem {
  quote: string;
  name: string;
  location?: string;
  stars?: number;
}

interface TestimonialsProps {
  eyebrow?: string;
  heading?: string;
  items: TestimonialItem[];
}

function StarIcon({filled = true}: {filled?: boolean}) {
  return (
    <svg
      width="14"
      height="14"
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

/**
 * ONYX — Testimonials Section
 * Dark theme customer testimonials.
 */
export default function Testimonials({
  eyebrow = 'Reviews',
  heading = 'The Culture Speaks',
  items,
}: TestimonialsProps) {
  const ref = useRevealChildren<HTMLDivElement>();
  if (!items.length) return null;

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
          {items.map((item, i) => (
            <div
              key={i}
              className="h-reveal p-6 md:p-8 bg-[var(--color-bg-level-0)] border border-[var(--color-border-muted)] rounded-lg"
            >
              {/* Stars */}
              {item.stars && (
                <div className="flex gap-0.5 mb-4 text-[var(--color-accent)]">
                  {Array.from({length: 5}).map((_, si) => (
                    <StarIcon key={si} filled={si < (item.stars || 0)} />
                  ))}
                </div>
              )}

              {/* Quote */}
              <p className="text-[var(--color-text-secondary)] leading-relaxed mb-6 italic">
                "{item.quote}"
              </p>

              {/* Author */}
              <div className="border-t border-[var(--color-border-muted)] pt-4">
                <p className="text-sm font-medium text-[var(--color-text-primary)]">
                  {item.name}
                </p>
                {item.location && (
                  <p className="text-xs text-[var(--color-text-tertiary)] mt-0.5">
                    {item.location}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
