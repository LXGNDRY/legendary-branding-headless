import NewsletterForm from '~/components/ui/NewsletterForm';
import {useReveal} from '~/hooks/useReveal';

interface NewsletterBandProps {
  eyebrow?: string;
  heading?: string;
  subtext?: string;
}

/**
 * ONYX — Newsletter Band
 * Dark theme newsletter signup section.
 */
export default function NewsletterBand({
  eyebrow = 'The List',
  heading = 'Enter the Legendary List.',
  subtext = 'First access to new drops, exclusive releases, and members-only offers.',
}: NewsletterBandProps) {
  const ref = useReveal<HTMLElement>();

  return (
    <section ref={ref} className="h-reveal h-section bg-[var(--color-bg-level-1)] border-t border-[var(--color-border-muted)]">
      <div className="h-container max-w-2xl text-center">
        <p className="h-eyebrow mb-4 text-[var(--color-text-tertiary)]">{eyebrow}</p>
        <h2 className="font-serif font-normal text-[clamp(1.75rem,4vw,3rem)] leading-[1.1] text-[var(--color-text-primary)] mb-4">
          {heading}
        </h2>
        <p className="text-[var(--color-text-secondary)] mb-8 max-w-md mx-auto">
          {subtext}
        </p>
        <NewsletterForm source="homepage-band" variant="band" buttonText="Subscribe →" />
      </div>
    </section>
  );
}
