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
    <section ref={ref} className="h-reveal h-section bg-[#F3F2EE] border-t border-[#E8E6E1]">
      <div className="h-container max-w-2xl text-center">
        {eyebrow && <p className="h-eyebrow mb-4">{eyebrow}</p>}
        <h2 className="font-serif font-normal text-[clamp(1.75rem,4vw,3rem)] leading-[1.05] text-[#1A1A1A] mb-3">
          {heading}
        </h2>
        {subtext && (
          <p className="text-[#6B6B6B] text-[0.95rem] mb-8">{subtext}</p>
        )}

        <NewsletterForm source="newsletter_band" variant="band" />
        <p className="mt-4 text-[0.7rem] text-[#9E9C97] tracking-wide">
          No spam. Unsubscribe any time.
        </p>
      </div>
    </section>
  );
}
