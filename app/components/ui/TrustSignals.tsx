import {useRouteLoaderData} from 'react-router';
import {LocaleLink as Link} from '~/components/ui/LocaleLink';
import {useTranslation} from '~/lib/i18n';
import {EMPTY_STORE_TRUST, type StoreTrust} from '~/lib/trust';

export function useStoreTrust(): StoreTrust {
  const data = useRouteLoaderData('root') as {storeTrust?: StoreTrust} | undefined;
  return data?.storeTrust ?? EMPTY_STORE_TRUST;
}

/**
 * Links to the store's own shipping and returns policies, plus the accepted
 * payment methods read from Shopify settings. No shipping, duty or returns
 * claim is written here: the policy pages are the single source.
 */
export default function TrustSignals({
  showPayments = true,
  className = '',
}: {
  showPayments?: boolean;
  className?: string;
}) {
  const t = useTranslation();
  const {paymentMethods, shippingPolicyTitle, refundPolicyTitle} = useStoreTrust();

  return (
    <div className={`space-y-2 ${className}`}>
      {(shippingPolicyTitle || refundPolicyTitle) && (
        <ul className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1.5 text-xs text-[var(--color-text-secondary)]">
          {shippingPolicyTitle && (
            <li>
              <Link to="/policies/shipping-policy" className="underline underline-offset-2 hover:text-[var(--color-text-primary)]">
                {shippingPolicyTitle}
              </Link>
            </li>
          )}
          {refundPolicyTitle && (
            <li>
              <Link to="/policies/refund-policy" className="underline underline-offset-2 hover:text-[var(--color-text-primary)]">
                {refundPolicyTitle}
              </Link>
            </li>
          )}
        </ul>
      )}
      {showPayments && paymentMethods.length > 0 && (
        <p className="text-center text-xs text-[var(--color-text-tertiary)]">
          <span className="sr-only">{t('trust.weAccept')}: </span>
          {paymentMethods.join(' · ')}
        </p>
      )}
    </div>
  );
}
