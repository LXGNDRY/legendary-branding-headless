import {useReveal} from '~/hooks/useReveal';
import NewsletterForm from '~/components/ui/NewsletterForm';

interface NewsletterBandProps {
  eyebrow?: string;
  heading?: string;
  subtext?: string;
}

export default function NewsletterBand({
  eyebrow = 'Stay in the loop',
  heading = 'Get early access to drops.',
  subtext = 'New arrivals, restocks, and editorial content — straight to your inbox.',
}: NewsletterBandProps) {
  const ref = useReveal<HTMLElement>();

  return (
    <section ref={ref} className="h-reveal h-section bg-[var(--color-surface)] border-t border-[var(--color-border-subtle)]">
      <div className="h-container max-w-2xl text-center">
        {eyebrow && <p className="h-eyebrow mb-4">{eyebrow}</p>}
        <h2 className="font-serif font-normal text-[clamp(1.75rem,4vw,3rem)] leading-[1.05] text-[var(--color-foreground)] mb-3">
          {heading}
        </h2>
        {subtext && (
          <p className="text-[var(--color-text-secondary)] text-[0.95rem] mb-8">{subtext}</p>
        )}

        <NewsletterForm source="newsletter_band" variant="band" />
        <p className="mt-4 text-[0.7rem] text-[var(--color-text-tertiary)] tracking-wide">
          No spam. Unsubscribe any time.
        </p>
      </div>
    </section>
  );
}
