import {useState} from 'react';

interface WaitlistFormProps {
  productTitle: string;
  variantTitle?: string;
}

/**
 * LEGENDARY STREETWEAR — Waitlist Form
 * For sold-out products — notifies customers when item is back in stock.
 * Ported from snippets/lb-waitlist.liquid
 */
export default function WaitlistForm({
  productTitle,
  variantTitle,
}: WaitlistFormProps) {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    // Note: In production, this would POST to a customer metafield / Klaviyo list
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <div className="p-4 bg-[var(--color-surface)] rounded-sm border border-[var(--color-border-medium)]">
        <p className="text-xs font-medium mb-1">You&apos;re on the list</p>
        <p className="text-xs text-[var(--color-text-secondary)]">
          We&apos;ll email <span className="font-medium">{email}</span> when
          this item is back in stock.
        </p>
      </div>
    );
  }

  return (
    <div className="p-4 bg-[var(--color-surface)] rounded-sm border border-[var(--color-border-medium)]">
      <p className="text-xs font-medium mb-2">
        Sold out? Get notified when it&apos;s back.
      </p>
      <form onSubmit={handleSubmit} className="flex gap-2">
        <label htmlFor="waitlist-email" className="sr-only">
          Email address
        </label>
        <input
          id="waitlist-email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="your@email.com"
          required
          className="flex-1 border border-[var(--color-border-medium)] px-3 py-2 text-xs bg-[var(--color-bg-level-1)] focus:border-[var(--color-accent)] outline-none transition-colors"
        />
        <button
          type="submit"
          className="px-4 py-2 bg-[var(--color-bg-level-3)] text-[var(--color-text-inverse)] text-[0.65rem] font-semibold tracking-[0.1em] uppercase hover:bg-black/80 transition-colors"
        >
          Notify Me
        </button>
      </form>
      <p className="text-[0.7rem] text-[var(--color-text-tertiary)] mt-2">
        We&apos;ll only email you about{' '}
        <span className="font-medium">{productTitle}</span>
        {variantTitle ? ` — ${variantTitle}` : ''}.
      </p>
    </div>
  );
}
