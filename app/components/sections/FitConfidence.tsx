import Button from '~/components/ui/Button';
import {useReveal} from '~/hooks/useReveal';

const fitPoints = [
  ['Built with shape', 'Structured shoulders and deliberate proportions create a stronger silhouette.'],
  ['Made to be worn oversized', 'Choose your usual size for the intended fit, or size down for a closer feel.'],
  ['Details before checkout', 'Each product page includes its specific fit and measurement guidance.'],
];

export default function FitConfidence() {
  const ref = useReveal<HTMLElement>();

  return (
    <section ref={ref} className="h-reveal h-section bg-[var(--color-bg-level-0)]">
      <div className="h-container grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-end">
        <div>
          <p className="h-eyebrow mb-4">Fit, without the guesswork</p>
          <h2 className="max-w-md font-serif text-[clamp(2.25rem,5vw,4.5rem)] leading-[0.96] text-[var(--color-text-primary)]">
            Built oversized.<br />Designed intentionally.
          </h2>
        </div>
        <div>
          <div className="grid gap-5 sm:grid-cols-3">
            {fitPoints.map(([title, body]) => (
              <div key={title} className="border-t border-[var(--color-border-medium)] pt-4">
                <h3 className="text-sm font-semibold text-[var(--color-text-primary)]">{title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-[var(--color-text-secondary)]">{body}</p>
              </div>
            ))}
          </div>
          <div className="mt-8">
            <Button as="link" to="/policies/size-guide" variant="outline">View the size guide</Button>
          </div>
        </div>
      </div>
    </section>
  );
}
