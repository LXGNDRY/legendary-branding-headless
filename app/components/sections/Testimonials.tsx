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
    <div className="flex gap-0.5 mb-4" aria-label={`${count} out of 5 stars`}>
      {Array.from({length: 5}).map((_, i) => (
        <svg
          key={i}
          width="12"
          height="12"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <polygon
            points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26"
            fill={i < count ? '#C9A84C' : 'transparent'}
            stroke="#C9A84C"
            strokeWidth="1.5"
          />
        </svg>
      ))}
    </div>
  );
}

export default function Testimonials({
  eyebrow = 'Customer Reviews',
  heading,
  items,
}: TestimonialsProps) {
  if (!items.length) return null;

  return (
    <section className="lb-section bg-[#0a0a0a]">
      <div className="lb-container">
        <div className="lb-section-header mb-12">
          <div>
            {eyebrow && (
              <div className="lb-eyebrow mb-2 text-white/40">{eyebrow}</div>
            )}
            {heading && (
              <h2 className="text-white">{heading}</h2>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {items.map((t, i) => (
            <blockquote
              key={i}
              className="bg-[#111] border-l-2 border-white/10 p-7 flex flex-col gap-4"
            >
              {(t.stars ?? 5) > 0 && <StarRating count={t.stars ?? 5} />}
              <p className="text-white/80 text-sm leading-relaxed flex-1">
                &ldquo;{t.quote}&rdquo;
              </p>
              <footer>
                <cite className="text-white text-xs font-semibold tracking-[0.12em] uppercase not-italic">
                  {t.name}
                </cite>
                {t.location && (
                  <span className="block text-white/40 text-[10px] tracking-widest uppercase mt-0.5">
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
