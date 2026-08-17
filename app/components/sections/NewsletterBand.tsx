import {useState} from 'react';
import {useReveal} from '~/hooks/useReveal';

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
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email || !email.includes('@')) {
      setError('Please enter a valid email address.');
      return;
    }
    setError('');
    setSubmitted(true);
  }

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

        {submitted ? (
          <p className="h-eyebrow text-[#1A1A1A]">You're in. Watch your inbox.</p>
        ) : (
          <form onSubmit={handleSubmit} noValidate>
            <div className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
              <label htmlFor="newsletter-email" className="sr-only">
                Email address
              </label>
              <input
                id="newsletter-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                autoComplete="email"
                className="flex-1 px-5 py-3.5 bg-[#FAF9F6] border border-[#E8E6E1] text-[#1A1A1A] text-sm placeholder-[#9E9C97] focus:outline-none focus:border-[#1A1A1A] transition-colors rounded-full"
              />
              <button type="submit" className="h-btn-primary whitespace-nowrap">
                Subscribe
              </button>
            </div>
            {error && (
              <p className="mt-3 text-[0.75rem] text-[#FF3B30]" role="alert">
                {error}
              </p>
            )}
            <p className="mt-4 text-[0.7rem] text-[#9E9C97] tracking-wide">
              No spam. Unsubscribe any time.
            </p>
          </form>
        )}
      </div>
    </section>
  );
}
