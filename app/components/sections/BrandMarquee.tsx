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
    <div className={`${bgClass} ${colorClass} overflow-hidden border-y py-3`}>
      <div
        className="flex whitespace-nowrap will-change-transform motion-reduce:flex-wrap motion-reduce:justify-center motion-reduce:overflow-hidden motion-reduce:max-h-[17.6px]"
        style={{animation: `h-marquee-scroll ${speed}s linear infinite`}}
        aria-hidden="true"
      >
        {/* Real content -- under prefers-reduced-motion this wraps and any
            row past the first (which would only ever contain whole,
            complete items -- flex-wrap never splits an item mid-text) gets
            clipped by max-height, so the bar shows as many full claims as
            fit on one line, at its normal single-line height, with nothing
            cut off mid-item. The py-3 that used to sit on this element
            moved to the outer wrapper: padding on the clipped element
            itself is included in max-height (border-box), so the second
            row's top sliver was bleeding into that padding allowance
            before it got clipped. Padding outside the clip boundary avoids
            that entirely. */}
        {renderItems('base')}
        {/* Duplicate copies purely for the seamless scroll loop -- hidden
            whenever the animation itself is stopped. */}
        <div className="flex motion-reduce:hidden">{renderItems('dup1')}</div>
        <div className="flex motion-reduce:hidden">{renderItems('dup2')}</div>
        <div className="flex motion-reduce:hidden">{renderItems('dup3')}</div>
      </div>
    </div>
  );
}
