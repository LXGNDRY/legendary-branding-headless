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
      ? 'flex-1 bg-transparent border border-[#333] border-r-0 px-4 py-3.5 text-sm text-[#FAF9F6] placeholder:text-[#6B6B6B] outline-none focus:border-[#FF3B30] transition-colors'
      : variant === 'footer'
        ? 'flex-1 border border-[#E8E6E1] border-r-0 px-4 py-3 text-sm text-[#1A1A1A] placeholder:text-[#9E9C97] outline-none focus:border-[#1A1A1A] transition-colors bg-transparent'
        : 'flex-1 px-5 py-3.5 bg-[#FAF9F6] border border-[#E8E6E1] text-[#1A1A1A] text-sm placeholder-[#9E9C97] focus:outline-none focus:border-[#1A1A1A] transition-colors rounded-full';

  const buttonStyles =
    variant === 'popup'
      ? 'px-6 py-3.5 bg-[#FF3B30] text-[#FAF9F6] hover:bg-[#E0342A] transition-colors whitespace-nowrap h-eyebrow font-semibold'
      : variant === 'footer'
        ? 'px-5 py-3 bg-[#1A1A1A] text-[#FAF9F6] h-eyebrow font-semibold hover:bg-[#FF3B30] transition-colors whitespace-nowrap'
        : 'h-btn-primary whitespace-nowrap';

  const formWrapperClass =
    variant === 'band'
      ? 'flex flex-col sm:flex-row gap-3 max-w-md mx-auto'
      : 'flex';

  return (
    <div className={className}>
      {isSuccess ? (
        <p
          className={`h-eyebrow ${variant === 'popup' ? 'text-[#FF3B30]' : 'text-[#1A1A1A]'}`}
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
          className={`mt-2 text-[0.75rem] ${variant === 'popup' ? 'text-[#FF3B30]' : 'text-[#FF3B30]'}`}
          role="alert"
        >
          {error}
        </p>
      )}
    </div>
  );
}
