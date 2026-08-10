interface BrandMarqueeProps {
  items: string[];
  style?: 'bold' | 'minimal';
  speed?: number; // seconds per loop
  direction?: 'left' | 'right';
  showIcon?: boolean;
  bgColor?: string;
  textColor?: string;
}

/**
 * LEGENDARY STREETWEAR — Brand Marquee Section
 * Infinite scrolling text strip for brand messaging, collabs, press.
 * Ported from sections/lb-brand-marquee.liquid
 */
export default function BrandMarquee({
  items,
  style = 'bold',
  speed = 30,
  direction = 'left',
  showIcon = true,
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

  return (
    <section
      className={`overflow-hidden border-y py-[14px] ${
        style === 'minimal'
          ? 'bg-white text-black border-[#e5e5e5]'
          : 'bg-white text-black border-black'
      }`}
      style={containerStyle}
      aria-hidden="true"
    >
      <div
        className="flex gap-12 whitespace-nowrap will-change-transform"
        style={{
          animation: 'lb-marquee-scroll linear infinite',
          ...trackStyle,
        }}
      >
        {repeatItems.map((item, i) => (
          <div
            key={i}
            className="flex items-center gap-4 text-[0.78rem] font-medium tracking-[0.2em] uppercase flex-shrink-0"
          >
            {showIcon && (
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
            {item}
          </div>
        ))}
      </div>

      <style>{`
        @keyframes lb-marquee-scroll {
          from { transform: translateX(0); }
          to { transform: translateX(-50%); }
        }
        @media (prefers-reduced-motion: reduce) {
          .lb-marquee__track { animation: none; }
        }
      `}</style>
    </section>
  );
}
