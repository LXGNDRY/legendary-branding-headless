import {useState} from 'react';
import {useFetcher} from 'react-router';

interface NewsletterFormProps {
  /** Where the form is being rendered (footer, band, popup) — sent to Klaviyo as custom_source */
  source?: string;
  /** Visual variant */
  variant?: 'footer' | 'band' | 'popup';
  /** Placeholder text for the email input */
  placeholder?: string;
  /** Button text */
  buttonText?: string;
  /** Additional CSS class for the form wrapper */
  className?: string;
}

/**
 * Shared newsletter signup form.
 *
 * Submits to /api/newsletter via React Router fetcher (no page reload).
 * Works with or without Klaviyo configured — gracefully degrades in dev.
 *
 * All 3 newsletter forms (footer, band, popup) use this component.
 */
export default function NewsletterForm({
  source = 'website',
  variant = 'band',
  placeholder = 'Enter your email',
  buttonText = 'Subscribe',
  className = '',
}: NewsletterFormProps) {
  const fetcher = useFetcher<{
    success?: boolean;
    error?: string;
    message?: string;
  }>();
  const [email, setEmail] = useState('');

  const isSubmitting = fetcher.state === 'submitting';
  const isSuccess = fetcher.data?.success === true;
  const error = fetcher.data?.error;

  const inputStyles =
    variant === 'popup'
      ? 'flex-1 bg-transparent border border-[var(--color-border-medium)] border-r-0 px-4 py-3.5 text-sm text-[var(--color-text-inverse)] placeholder:text-[var(--color-text-secondary)] outline-none focus:border-[var(--color-accent)] transition-colors'
      : variant === 'footer'
        ? 'flex-1 border border-[var(--color-border-subtle)] border-r-0 px-4 py-3 text-sm text-[var(--color-foreground)] placeholder:text-[var(--color-text-tertiary)] outline-none focus:border-[var(--color-foreground)] transition-colors bg-transparent'
        : 'flex-1 px-5 py-3.5 bg-[var(--color-background)] border border-[var(--color-border-subtle)] text-[var(--color-foreground)] text-sm placeholder-[var(--color-text-tertiary)] focus:outline-none focus:border-[var(--color-foreground)] transition-colors rounded-full';

  const buttonStyles =
    variant === 'popup'
      ? 'px-6 py-3.5 bg-[var(--color-accent)] text-[var(--color-text-inverse)] hover:bg-[var(--color-accent-hover)] transition-colors whitespace-nowrap h-eyebrow font-semibold'
      : variant === 'footer'
        ? 'px-5 py-3 bg-[var(--color-foreground)] text-[var(--color-text-inverse)] h-eyebrow font-semibold hover:bg-[var(--color-accent)] transition-colors whitespace-nowrap'
        : 'h-btn-primary whitespace-nowrap';

  const formWrapperClass =
    variant === 'band'
      ? 'flex flex-col sm:flex-row gap-3 max-w-md mx-auto'
      : 'flex';

  return (
    <div className={className}>
      {isSuccess ? (
        <p
          className={`h-eyebrow ${variant === 'popup' ? 'text-[var(--color-accent)]' : 'text-[var(--color-foreground)]'}`}
        >
          {fetcher.data?.message || "You're in. Watch your inbox."}
        </p>
      ) : (
        <fetcher.Form method="POST" action="/api/newsletter" className={formWrapperClass}>
          <input type="hidden" name="source" value={source} />
          <label htmlFor={`newsletter-email-${source}`} className="sr-only">
            Email address
          </label>
          <input
            id={`newsletter-email-${source}`}
            name="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder={placeholder}
            autoComplete="email"
            required
            disabled={isSubmitting}
            className={inputStyles}
          />
          <button
            type="submit"
            disabled={isSubmitting}
            className={`${buttonStyles} disabled:opacity-60`}
          >
            {isSubmitting ? 'Joining…' : buttonText}
          </button>
        </fetcher.Form>
      )}
      {error && (
        <p
          className={`mt-2 text-[0.75rem] ${variant === 'popup' ? 'text-[var(--color-accent)]' : 'text-[var(--color-accent)]'}`}
          role="alert"
        >
          {error}
        </p>
      )}
    </div>
  );
}
