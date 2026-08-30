interface HeroPlaceholderProps {
  className?: string;
  variant?: 'dark' | 'light';
}

/**
 * HANSSEN x LEGENDARY — hero placeholder background (CSS/SVG only)
 *
 * Two variants:
 * - dark: off-black base with diagonal stripes + radial glow + red accent
 * - light: off-white/cream base with subtle pattern
 *
 * Just the background — content overlay is provided by the parent component.
 */
export default function HeroPlaceholder({
  className = '',
  variant = 'dark',
}: HeroPlaceholderProps) {
  const isDark = variant === 'dark';
  const bgClass = isDark ? 'bg-[var(--color-foreground)]' : 'bg-[var(--color-border-subtle)]';
  const stripeOpacity = isDark ? 'opacity-[0.06]' : 'opacity-[0.08]';
  const glowVar = isDark ? 'var(--color-accent)' : 'var(--color-foreground)';

  return (
    <div
      className={`relative w-full h-full overflow-hidden ${bgClass} ${className}`}
      aria-hidden="true"
    >
      {/* Diagonal stripe pattern */}
      <svg
        className={`absolute inset-0 w-full h-full ${stripeOpacity}`}
        xmlns="http://www.w3.org/2000/svg"
        preserveAspectRatio="none"
      >
        <defs>
          <pattern
            id="diagStripes"
            patternUnits="userSpaceOnUse"
            width="40"
            height="40"
            patternTransform="rotate(45)"
          >
            <line
              x1="0"
              y1="0"
              x2="0"
              y2="40"
              stroke={glowVar}
              strokeWidth="1.5"
            />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#diagStripes)" />
      </svg>

      {/* Radial glow accent */}
      <div
        className="absolute inset-0 opacity-[0.12]"
        style={{
          background: `radial-gradient(circle at 30% 40%, ${glowVar} 0%, transparent 55%)`,
        }}
      />

      {/* Film grain / noise */}
      <div
        className="absolute inset-0 opacity-[0.03] mix-blend-overlay"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='3'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
        }}
      />

      {/* Vignette */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: isDark
            ? 'radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,0.4) 100%)'
            : 'radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,0.08) 100%)',
        }}
      />
    </div>
  );
}
