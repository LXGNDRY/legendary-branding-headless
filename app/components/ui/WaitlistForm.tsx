import {useFetcher} from 'react-router';

interface WaitlistFormProps {
  productTitle: string;
  productId: string;
  variantId: string;
  variantTitle?: string;
}

/**
 * LEGENDARY STREETWEAR — Waitlist Form
 * For sold-out products — notifies customers when item is back in stock.
 * Ported from snippets/lb-waitlist.liquid
 */
export default function WaitlistForm({
  productTitle,
  productId,
  variantId,
  variantTitle,
}: WaitlistFormProps) {
  const fetcher = useFetcher<{success?: boolean; error?: string}>();

  if (fetcher.data?.success) {
    return (
      <div className="p-4 bg-[var(--color-surface)] rounded-sm border border-[var(--color-border-medium)]">
        <p className="text-xs font-medium mb-1">You&apos;re on the list</p>
        <p className="text-xs text-[var(--color-text-secondary)]">
          We&apos;ll email you when this item is back in stock.
        </p>
      </div>
    );
  }

  return (
    <div className="p-4 bg-[var(--color-surface)] rounded-sm border border-[var(--color-border-medium)]">
      <p className="text-xs font-medium mb-2">
        Sold out? Get notified when it&apos;s back.
      </p>
      <fetcher.Form method="post" action="/api/waitlist" className="flex gap-2">
        <input type="hidden" name="productId" value={productId} />
        <input type="hidden" name="variantId" value={variantId} />
        <input type="hidden" name="productTitle" value={productTitle} />
        <input type="hidden" name="variantTitle" value={variantTitle ?? ''} />
        <label htmlFor="waitlist-email" className="sr-only">
          Email address
        </label>
        <input
          id="waitlist-email"
          name="email"
          type="email"
          placeholder="your@email.com"
          required
          className="flex-1 border border-[var(--color-border-medium)] px-3 py-2 text-xs bg-[var(--color-bg-level-1)] focus:border-[var(--color-accent)] outline-none transition-colors"
        />
        <button
          type="submit"
          disabled={fetcher.state !== 'idle'}
          className="px-4 py-2 bg-[var(--color-bg-level-3)] text-[var(--color-text-inverse)] text-[0.65rem] font-semibold tracking-[0.1em] uppercase hover:bg-black/80 transition-colors"
        >
          {fetcher.state !== 'idle' ? 'Saving…' : 'Notify Me'}
        </button>
      </fetcher.Form>
      {fetcher.data?.error && (
        <p role="alert" className="text-xs text-[var(--color-error)] mt-2">
          {fetcher.data.error}
        </p>
      )}
      <p className="text-[0.7rem] text-[var(--color-text-tertiary)] mt-2">
        We&apos;ll only email you about{' '}
        <span className="font-medium">{productTitle}</span>
        {variantTitle ? `, ${variantTitle}` : ''}.
      </p>
    </div>
  );
}
