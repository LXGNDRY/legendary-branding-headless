const signals = [
  {title: '220GSM+ fabrics', detail: 'Weight you can feel'},
  {title: 'Made to order', detail: 'Produced with intention'},
  {title: 'Intentional fits', detail: 'Boxy and oversized by design'},
  {title: 'Secure checkout', detail: 'Shop with confidence'},
];

export default function TrustStrip() {
  return (
    <section aria-label="Why shop Legendary Branding" className="border-y border-[var(--color-border-muted)] bg-[var(--color-bg-level-1)]">
      <div className="h-container grid grid-cols-2 lg:grid-cols-4 divide-x-0 lg:divide-x divide-[var(--color-border-muted)]">
        {signals.map((signal) => (
          <div key={signal.title} className="py-5 sm:py-6 lg:px-8 even:pl-5 odd:pr-5 lg:even:pl-8 lg:odd:pr-8">
            <p className="text-sm font-medium text-[var(--color-text-primary)]">{signal.title}</p>
            <p className="mt-1 text-xs leading-relaxed text-[var(--color-text-tertiary)]">{signal.detail}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
