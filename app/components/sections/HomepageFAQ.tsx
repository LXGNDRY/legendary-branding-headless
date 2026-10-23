import {useState} from 'react';
import {LocaleLink as Link} from '~/components/ui/LocaleLink';

const questions = [
  {question: 'What does made to order mean?', answer: 'Each piece is produced after an order is placed. Check the product page and shipping policy for the most current fulfillment details.'},
  {question: 'How does the fit run?', answer: 'Many Legendary Branding pieces are intentionally boxy or oversized. Product pages include item-specific fit notes and measurements.'},
  {question: 'Which fabric weight is right for me?', answer: 'GSM describes fabric weight. Higher GSM generally creates a more substantial, structured feel; every product page lists its garment weight.'},
  {question: 'Where can I find shipping and return information?', answer: 'Our current policies explain shipping, returns, and the information needed before you place an order.'},
];

export default function HomepageFAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <section className="h-section border-y border-[var(--color-border-muted)] bg-[var(--color-bg-level-1)]">
      <div className="h-container grid gap-10 lg:grid-cols-[0.75fr_1.25fr]">
        <div>
          <p className="h-eyebrow mb-4">Before you order</p>
          <h2 className="font-serif text-[clamp(2.25rem,5vw,4rem)] leading-[1] text-[var(--color-text-primary)]">Good to know.</h2>
          <div className="mt-7 flex flex-wrap gap-x-5 gap-y-3">
            <Link to="/policies/shipping-policy" className="h-link">Shipping</Link>
            <Link to="/policies/refund-policy" className="h-link">Returns</Link>
            <Link to="/policies/size-guide" className="h-link">Size guide</Link>
          </div>
        </div>
        <div className="divide-y divide-[var(--color-border-muted)] border-y border-[var(--color-border-muted)]">
          {questions.map((item, index) => {
            const isOpen = openIndex === index;
            const panelId = `homepage-faq-${index}`;
            return (
              <div key={item.question}>
                <h3>
                  <button type="button" className="flex w-full items-center justify-between gap-5 py-5 text-left text-base font-medium text-[var(--color-text-primary)]" aria-expanded={isOpen} aria-controls={panelId} onClick={() => setOpenIndex(isOpen ? null : index)}>
                    {item.question}<span className="shrink-0 text-xl font-normal text-[var(--color-accent)]" aria-hidden="true">{isOpen ? '−' : '+'}</span>
                  </button>
                </h3>
                {isOpen && <p id={panelId} className="max-w-2xl pb-5 pr-10 text-sm leading-relaxed text-[var(--color-text-secondary)]">{item.answer}</p>}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
