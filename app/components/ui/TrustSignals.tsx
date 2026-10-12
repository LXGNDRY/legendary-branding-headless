import {useRouteLoaderData} from 'react-router';
import {useTranslation} from '~/lib/i18n';
import {EMPTY_STORE_TRUST, type StoreTrust} from '~/lib/trust';

export function useStoreTrust(): StoreTrust {
  const data = useRouteLoaderData('root') as {storeTrust?: StoreTrust} | undefined;
  return data?.storeTrust ?? EMPTY_STORE_TRUST;
}

function CheckIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
      <path d="M2.5 6.5l2.25 2.25L9.5 3.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/**
 * Shipping, returns, secure checkout and accepted payment methods, read
 * from the store's own Shopify settings via the root loader. A claim the
 * store can't back (e.g. a refund policy with no stated window) is left
 * out rather than guessed.
 */
export default function TrustSignals({
  showPayments = true,
  className = '',
}: {
  showPayments?: boolean;
  className?: string;
}) {
  const t = useTranslation();
  const {returnDays, paymentMethods} = useStoreTrust();
  const items = [
    t('trust.freeShipping'),
    returnDays ? t('trust.returns', {days: returnDays}) : null,
    t('trust.secureCheckout'),
  ].filter((item): item is string => Boolean(item));

  return (
    <div className={`space-y-2 ${className}`}>
      <ul className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1.5 text-xs text-[var(--color-text-secondary)]">
        {items.map((item) => (
          <li key={item} className="inline-flex items-center gap-1.5">
            <span className="text-[var(--color-accent)]">
              <CheckIcon />
            </span>
            {item}
          </li>
        ))}
      </ul>
      {showPayments && paymentMethods.length > 0 && (
        <p className="text-center text-xs text-[var(--color-text-tertiary)]">
          <span className="sr-only">{t('trust.weAccept')}: </span>
          {paymentMethods.join(' · ')}
        </p>
      )}
    </div>
  );
}
