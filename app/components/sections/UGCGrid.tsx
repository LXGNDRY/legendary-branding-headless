import Placeholder from '~/components/ui/Placeholder';

interface UGCGridProps {
  eyebrow?: string;
  heading?: string;
  hashtag?: string;
  count?: number;
}

/**
 * Instagram-style customer-photo grid. Uses <Placeholder> tiles until real
 * customer/UGC photography is approved and wired in (see Milestone 12 in
 * CLAUDE.md) -- never sourced independently ahead of that.
 */
export default function UGCGrid({
  eyebrow = 'Community',
  heading = 'Worn By The Culture',
  hashtag = '#LegendaryBranding',
  count = 6,
}: UGCGridProps) {
  return (
    <section className="h-section bg-[var(--color-bg-level-0)]">
      <div className="h-container">
        <div className="text-center mb-10">
          {eyebrow && <p className="h-eyebrow mb-3">{eyebrow}</p>}
          <h2 className="font-serif font-normal text-[clamp(1.75rem,3.5vw,2.75rem)] leading-[1.1] text-[var(--color-text-primary)] mb-4">
            {heading}
          </h2>
          <p className="text-sm text-[var(--color-text-secondary)]">
            Tag <span className="text-[var(--color-text-primary)]">{hashtag}</span> for a chance to
            be featured.
          </p>
        </div>

        <div className="grid grid-cols-3 md:grid-cols-6 gap-2 md:gap-3">
          {Array.from({length: count}).map((_, i) => (
            <Placeholder key={i} aspect="aspect-square" label="Customer Photo" />
          ))}
        </div>
      </div>
    </section>
  );
}
