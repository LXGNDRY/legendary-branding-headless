import {useState, useEffect} from 'react';
import NewsletterForm from '~/components/ui/NewsletterForm';

const STORAGE_KEY = 'lb_newsletter_dismissed';
const DELAY_MS = 4000;

/**
 * HANSSEN — Newsletter Popup
 * Exit-intent / timed newsletter sign-up modal.
 */
export default function NewsletterPopup() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (sessionStorage.getItem(STORAGE_KEY)) return;
    const t = setTimeout(() => setVisible(true), DELAY_MS);
    return () => clearTimeout(t);
  }, []);

  function dismiss() {
    sessionStorage.setItem(STORAGE_KEY, '1');
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Subscribe to our newsletter"
      className="fixed inset-0 z-[2000] flex items-end sm:items-center justify-center p-4"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-[var(--color-foreground)]/70"
        onClick={dismiss}
        aria-hidden="true"
      />

      {/* Panel */}
      <div className="relative bg-[var(--color-foreground)] text-[var(--color-text-inverse)] max-w-md w-full p-8 sm:p-12">
        <button
          onClick={dismiss}
          className="absolute top-5 right-5 text-[var(--color-text-tertiary)] hover:text-[var(--color-text-inverse)] transition-colors p-1"
          aria-label="Close"
        >
          <svg width="18" height="18" viewBox="0 0 16 16" fill="none" aria-hidden="true">
            <path d="M1 1l14 14M15 1L1 15" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
        </button>

        <p className="h-eyebrow mb-4 text-[var(--color-text-tertiary)]">The List</p>
        <h2 className="text-[clamp(1.75rem,3vw,2.5rem)] font-serif leading-tight mb-3">
          Stay Legendary
        </h2>
        <p className="text-[var(--color-text-inverse)]/60 text-sm leading-relaxed mb-8">
          Early access to drops, exclusive offers, and behind-the-scenes content.
        </p>
        <NewsletterForm
          source="newsletter_popup"
          variant="popup"
          buttonText="Join →"
          placeholder="your@email.com"
        />
        <p className="text-[var(--color-text-secondary)] text-[11px] mt-4">No spam. Unsubscribe anytime.</p>
      </div>
    </div>
  );
}
