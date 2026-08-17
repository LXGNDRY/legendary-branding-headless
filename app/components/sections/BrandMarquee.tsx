interface BrandMarqueeProps {
  items: string[];
  style?: 'bold' | 'minimal' | 'editorial';
  speed?: number;
  direction?: 'left' | 'right';
  showIcon?: boolean;
  bgColor?: string;
  textColor?: string;
}

/**
 * HANSSEN — Brand Marquee Section
 * Infinite scrolling text strip for brand messaging, collabs, press.
 * Uses h-marquee-scroll animation from app.css.
 *
 * Variants:
 * - editorial: off-black on off-white, serif display wordmark, hairline borders
 * - bold: high-contrast, thicker borders (legacy default)
 * - minimal: subtle gray borders (legacy minimal)
 */
export default function BrandMarquee({
  items,
  style = 'editorial',
  speed = 40,
  direction = 'left',
  showIcon = false,
  bgColor,
  textColor,
}: BrandMarqueeProps) {
  const repeatItems = [...items, ...items, ...items, ...items, ...items, ...items];

  const containerStyle = {
    ...(bgColor ? {background: bgColor} : {}),
    ...(textColor ? {color: textColor} : {}),
  };

  const trackStyle = {
    animationDuration: `${speed}s`,
    animationDirection: direction === 'right' ? 'reverse' : 'normal',
  };

  const variantClasses = {
    editorial:
      'bg-[#FAF9F6] text-[#1A1A1A] border-[#E8E6E1] border-y py-4',
    bold:
      'bg-white text-black border-black border-y py-[14px]',
    minimal:
      'bg-white text-black border-[#e5e5e5] border-y py-[14px]',
  };

  const textClasses = {
    editorial:
      'font-serif text-[clamp(1.5rem,3.5vw,2.75rem)] italic leading-none tracking-tight',
    bold:
      'text-[0.78rem] font-medium tracking-[0.2em] uppercase',
    minimal:
      'text-[0.78rem] font-medium tracking-[0.2em] uppercase',
  };

  return (
    <section
      className={`overflow-hidden ${variantClasses[style]}`}
      style={containerStyle}
      aria-hidden="true"
    >
      <div
        className="flex gap-16 whitespace-nowrap will-change-transform"
        style={{
          animation: 'h-marquee-scroll linear infinite',
          ...trackStyle,
        }}
      >
        {repeatItems.map((item, i) => (
          <div
            key={i}
            className={`flex items-center gap-6 flex-shrink-0 ${textClasses[style]}`}
          >
            {showIcon && style !== 'editorial' && (
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="w-3 h-3 opacity-60"
              >
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
              </svg>
            )}
            {style === 'editorial' && (
              <span className="text-[#FF3B30] not-italic text-2xl font-serif">✦</span>
            )}
            {item}
          </div>
        ))}
      </div>
    </section>
  );
}
