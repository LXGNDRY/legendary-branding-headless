import {useReveal} from '~/hooks/useReveal';
import Button from '~/components/ui/Button';

interface EditorialBandProps {
  eyebrow?: string;
  heading: string;
  body?: string;
  primaryLabel?: string;
  primaryHref?: string;
  secondaryLabel?: string;
  secondaryHref?: string;
  theme?: 'dark' | 'light' | 'accent';
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

  const bgClass =
    theme === 'accent'
      ? 'bg-[var(--color-accent)]'
      : theme === 'light'
        ? 'bg-[var(--color-bg-level-1)]'
        : 'bg-[var(--color-bg-level-1)]';
  const eyebrowClass =
    theme === 'accent'
      ? 'text-white/70'
      : 'text-[var(--color-text-tertiary)]';
  const headingClass =
    theme === 'accent'
      ? 'text-white'
      : 'text-[var(--color-text-primary)]';
  const bodyClass =
    theme === 'accent'
      ? 'text-white/80'
      : 'text-[var(--color-text-secondary)]';

  return (
    <section ref={ref} className={`h-reveal h-section ${bgClass} border-t border-b border-[var(--color-border-muted)]`}>
      <div className="h-container max-w-3xl text-center">
        {eyebrow && (
          <p className={`h-eyebrow mb-5 ${eyebrowClass}`}>{eyebrow}</p>
        )}
        <h2 className={`font-serif font-normal text-[clamp(2rem,5vw,4rem)] leading-[1.05] tracking-[-0.01em] mb-6 ${headingClass}`}>
          {heading}
        </h2>
        {body && (
          <p className={`text-base md:text-lg leading-relaxed mb-10 max-w-[55ch] mx-auto ${bodyClass}`}>
            {body}
          </p>
        )}
        {(primaryLabel || secondaryLabel) && (
          <div className="flex flex-wrap gap-3 justify-center">
            {primaryLabel && primaryHref && (
              <Button
                as="link"
                to={primaryHref}
                variant={theme === 'accent' ? 'outline' : 'primary'}
                size="md"
                className={theme === 'accent' ? 'text-white border-white/50 hover:bg-white hover:text-[var(--color-accent)]' : ''}
              >
                {primaryLabel}
              </Button>
            )}
            {secondaryLabel && secondaryHref && (
              <Button
                as="link"
                to={secondaryHref}
                variant="outline"
                size="md"
                className={theme === 'accent' ? 'text-white border-white/40 hover:bg-white/10 hover:border-white/70' : ''}
              >
                {secondaryLabel}
              </Button>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
