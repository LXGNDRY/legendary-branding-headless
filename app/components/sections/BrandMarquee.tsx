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

  const renderItems = (keyPrefix: string) =>
    items.map((item, i) => (
      <span key={`${keyPrefix}-${i}`} className="inline-flex items-center gap-8 mx-8">
        <span className="text-[11px] font-semibold tracking-[0.2em] uppercase">
          {item}
        </span>
        <span className="text-[var(--color-accent)] text-xs" aria-hidden="true">✦</span>
      </span>
    ));

  return (
    <div className={`${bgClass} ${colorClass} overflow-hidden border-y`}>
      <div
        className="h-marquee-track flex whitespace-nowrap py-3 will-change-transform motion-reduce:flex-wrap motion-reduce:justify-center motion-reduce:py-4"
        style={{animation: `h-marquee-scroll ${speed}s linear infinite`}}
        aria-hidden="true"
      >
        {/* Real content -- the only copy still shown once the scroll
            animation is stopped (prefers-reduced-motion). Wraps and
            centers cleanly instead of being clipped mid-item. */}
        {renderItems('base')}
        {/* Duplicate copies purely for the seamless scroll loop -- hidden
            whenever the animation itself is stopped, so the static state
            shows each claim exactly once. */}
        <div className="flex motion-reduce:hidden">{renderItems('dup1')}</div>
        <div className="flex motion-reduce:hidden">{renderItems('dup2')}</div>
        <div className="flex motion-reduce:hidden">{renderItems('dup3')}</div>
      </div>
    </div>
  );
}
