interface BrandMarqueeProps {
  items: string[];
  style?: 'subtle' | 'bold';
  speed?: number;
}

/**
 * ONYX — Brand Marquee
 * Dark theme scrolling brand claim marquee.
 */
export default function BrandMarquee({items, style = 'subtle', speed = 35}: BrandMarqueeProps) {
  const colorClass = style === 'bold'
    ? 'text-[var(--color-text-primary)] border-[var(--color-border-muted)]'
    : 'text-[var(--color-text-tertiary)] border-[var(--color-border-subtle)]';
  const bgClass = style === 'bold'
    ? 'bg-[var(--color-bg-level-1)]'
    : 'bg-[var(--color-bg-level-0)]';

  return (
    <div className={`${bgClass} ${colorClass} overflow-hidden border-y`}>
      <div
        className="flex whitespace-nowrap py-3 will-change-transform"
        style={{animation: `h-marquee-scroll ${speed}s linear infinite`}}
        aria-hidden="true"
      >
        {[...items, ...items, ...items, ...items].map((item, i) => (
          <span key={i} className="inline-flex items-center gap-8 mx-8">
            <span className="text-[11px] font-semibold tracking-[0.2em] uppercase">
              {item}
            </span>
            <span className="text-[var(--color-accent)] text-xs" aria-hidden="true">✦</span>
          </span>
        ))}
      </div>
    </div>
  );
}
