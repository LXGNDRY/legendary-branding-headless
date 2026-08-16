import {useState, useEffect} from 'react';

const STORAGE_KEY = 'lb_newsletter_dismissed';
const DELAY_MS = 4000;

export default function NewsletterPopup() {
  const [visible, setVisible] = useState(false);
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);

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

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email) return;
    setSubmitted(true);
    setTimeout(dismiss, 2000);
  }

  if (!visible) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Subscribe to our newsletter"
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60"
        onClick={dismiss}
        aria-hidden="true"
      />

      {/* Panel */}
      <div className="relative bg-[#0a0a0a] text-white max-w-md w-full p-8 sm:p-10">
        <button
          onClick={dismiss}
          className="absolute top-4 right-4 text-white/50 hover:text-white transition-colors p-1"
          aria-label="Close"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
            <path d="M1 1l14 14M15 1L1 15" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
        </button>

        {!submitted ? (
          <>
            <div className="lb-eyebrow mb-3 text-white/40">The List</div>
            <h2 className="text-2xl font-normal mb-2 text-white">Stay Legendary</h2>
            <p className="text-white/60 text-sm leading-relaxed mb-6">
              Early access to drops, exclusive offers, and behind-the-scenes content.
            </p>
            <form onSubmit={handleSubmit} className="flex">
              <label htmlFor="popup-email" className="sr-only">Email address</label>
              <input
                id="popup-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                required
                className="flex-1 bg-white/10 border border-white/20 border-r-0 px-4 py-3 text-sm text-white placeholder:text-white/30 outline-none focus:border-white/60 transition-colors"
              />
              <button
                type="submit"
                className="px-5 py-3 bg-white text-[#0a0a0a] text-[0.65rem] font-semibold tracking-[0.15em] uppercase hover:bg-white/90 transition-colors whitespace-nowrap"
              >
                Join →
              </button>
            </form>
            <p className="text-white/30 text-[10px] mt-3">No spam. Unsubscribe anytime.</p>
          </>
        ) : (
          <div className="text-center py-4">
            <div className="lb-eyebrow mb-3 text-white/40">You&apos;re In</div>
            <h2 className="text-2xl font-normal text-white">Welcome to the list.</h2>
          </div>
        )}
      </div>
    </div>
  );
}
