import type {ActiveDiscount} from '~/lib/discounts';

/**
 * Homepage "Current Offers" section — a dedicated, always-visible block
 * listing the shop's real active Shopify discounts (see ~/lib/discounts.ts
 * for what counts as safe to advertise publicly: automatic discounts and
 * storewide codes only, never customer-restricted codes). Renders nothing
 * when there are no active discounts, so the section simply doesn't exist
 * on the page rather than showing an empty placeholder.
 */
export default function CurrentOffers({discounts}: {discounts: ActiveDiscount[]}) {
  if (discounts.length === 0) return null;

  return (
    <section className="h-section bg-[var(--color-bg-level-1)] border-y border-[var(--color-border-muted)]">
      <div className="h-container">
        <div className="mb-10 text-center">
          <p className="h-eyebrow mb-3 text-[var(--color-accent)]">Live Right Now</p>
          <h2 className="font-serif font-normal text-[clamp(1.75rem,3.5vw,2.75rem)] leading-[1.1] text-[var(--color-text-primary)]">
            Current Offers
          </h2>
        </div>
        <div className="mx-auto grid max-w-3xl gap-4 sm:grid-cols-2">
          {discounts.map((discount) => (
            <div
              key={discount.id}
              className="flex items-start gap-3 rounded-md border border-[var(--color-border-medium)] bg-[var(--color-bg-level-0)] p-5"
            >
              <span className="mt-0.5 text-[var(--color-accent)]" aria-hidden="true">✦</span>
              <p className="text-sm text-[var(--color-text-secondary)]">
                {discount.summary}
                {discount.kind === 'code' && (
                  <>
                    {' '}— use code{' '}
                    <span className="font-semibold text-[var(--color-text-primary)]">{discount.code}</span>
                  </>
                )}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
