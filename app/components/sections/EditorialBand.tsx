import {Link} from 'react-router';
import {useReveal} from '~/hooks/useReveal';

interface EditorialBandProps {
  eyebrow?: string;
  heading: string;
  body?: string;
  primaryLabel?: string;
  primaryHref?: string;
  secondaryLabel?: string;
  secondaryHref?: string;
  theme?: 'dark' | 'light';
}

export default function EditorialBand({
  eyebrow,
  heading,
  body,
  primaryLabel,
  primaryHref,
  secondaryLabel,
  secondaryHref,
  theme = 'dark',
}: EditorialBandProps) {
  const ref = useReveal<HTMLElement>();

  const isDark = theme === 'dark';
  const bg = isDark ? 'bg-[var(--color-foreground)]' : 'bg-[var(--color-background)]';
  const eyebrowColor = isDark ? 'text-[var(--color-text-inverse)]/40' : 'text-[var(--color-text-secondary)]';
  const textColor = isDark ? 'text-[var(--color-text-inverse)]' : 'text-[var(--color-foreground)]';
  const bodyColor = isDark ? 'text-[var(--color-text-inverse)]/60' : 'text-[var(--color-text-secondary)]';

  return (
    <section ref={ref} className={`h-reveal h-section ${bg}`}>
      <div className="h-container max-w-3xl text-center">
        {eyebrow && (
          <p className={`h-eyebrow mb-5 ${eyebrowColor}`}>{eyebrow}</p>
        )}
        <h2 className={`font-serif font-normal text-[clamp(2.5rem,5vw,4.5rem)] leading-[1.05] tracking-[-0.01em] mb-6 ${textColor}`}>
          {heading}
        </h2>
        {body && (
          <p className={`text-[1rem] leading-relaxed mb-10 max-w-[50ch] mx-auto ${bodyColor}`}>
            {body}
          </p>
        )}
        {(primaryLabel || secondaryLabel) && (
          <div className="flex flex-wrap gap-3 justify-center">
            {primaryLabel && primaryHref && (
              <Link
                to={primaryHref}
                className={isDark
                  ? 'inline-flex items-center justify-center gap-2 font-semibold tracking-[0.12em] uppercase border border-[var(--color-text-inverse)] text-[0.75rem] px-7 py-3.5 rounded-full text-[var(--color-text-inverse)] hover:bg-[var(--color-background)] hover:text-[var(--color-foreground)] transition-all duration-200 hover:-translate-y-px'
                  : 'h-btn-primary'}
              >
                {primaryLabel}
              </Link>
            )}
            {secondaryLabel && secondaryHref && (
              <Link
                to={secondaryHref}
                className={isDark
                  ? 'inline-flex items-center justify-center gap-2 font-semibold tracking-[0.12em] uppercase text-[0.75rem] px-7 py-3.5 text-[var(--color-text-inverse)]/60 hover:text-[var(--color-text-inverse)] transition-colors underline-offset-4 hover:underline'
                  : 'h-btn-outline'}
              >
                {secondaryLabel}
              </Link>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
