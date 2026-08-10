interface HeroPlaceholderProps {
  className?: string;
}

/**
 * Legendary Branding — hero placeholder background (CSS/SVG only)
 * Bold editorial streetwear aesthetic: diagonal stripe pattern,
 * radial glow, black background, subtle grain feel.
 *
 * Just the background — content overlay is provided by the parent component.
 * Used while real product/campaign images are being set up.
 */
export default function HeroPlaceholder({
  className = '',
}: HeroPlaceholderProps) {
  return (
    <div
      className={`relative w-full h-full overflow-hidden bg-black ${className}`}
      aria-hidden="true"
    >
      {/* Diagonal stripe pattern (brutalist/streetwear) */}
      <svg
        className="absolute inset-0 w-full h-full opacity-[0.07]"
        xmlns="http://www.w3.org/2000/svg"
        preserveAspectRatio="none"
      >
        <defs>
          <pattern
            id="lb-hero-stripes"
            patternUnits="userSpaceOnUse"
            width="120"
            height="120"
            patternTransform="rotate(45)"
          >
            <line
              x1="0"
              y1="0"
              x2="0"
              y2="120"
              stroke="white"
              strokeWidth="1.5"
            />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#lb-hero-stripes)" />
      </svg>

      {/* Radial glow — warm spotlight from the right */}
      <div
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse at 70% 40%, rgba(255,255,255,0.12) 0%, rgba(255,255,255,0.04) 30%, transparent 65%)',
        }}
      />

      {/* Subtle vignette — dark edges */}
      <div
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,0.5) 100%)',
        }}
      />

      {/* Horizontal film grain / scan line overlay */}
      <svg
        className="absolute inset-0 w-full h-full opacity-[0.03]"
        xmlns="http://www.w3.org/2000/svg"
        preserveAspectRatio="none"
      >
        <defs>
          <pattern
            id="lb-hero-grain"
            patternUnits="userSpaceOnUse"
            width="4"
            height="4"
          >
            <rect width="4" height="1" fill="white" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#lb-hero-grain)" />
      </svg>
    </div>
  );
}
