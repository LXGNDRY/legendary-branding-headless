/**
 * Store-level trust facts, derived from the shop's own Shopify settings
 * (refund policy, accepted payment methods, brand logo) so storefront
 * claims can't drift from what the store actually offers.
 */
export interface StoreTrust {
  /** Return window in days, parsed from the published refund policy; null when it doesn't state one. */
  returnDays: number | null;
  refundPolicyUrl: string | null;
  /** Human-readable payment method names, cards first then wallets. */
  paymentMethods: string[];
  logoUrl: string | null;
  /** ISO codes of every market the store sells to -- the store-wide return policy covers all of them. */
  returnCountries: string[];
}

const CARD_BRAND_LABELS: Record<string, string> = {
  VISA: 'Visa',
  MASTERCARD: 'Mastercard',
  AMERICAN_EXPRESS: 'Amex',
  DISCOVER: 'Discover',
  DINERS_CLUB: 'Diners Club',
  JCB: 'JCB',
};

const WALLET_LABELS: Record<string, string> = {
  APPLE_PAY: 'Apple Pay',
  GOOGLE_PAY: 'Google Pay',
  SHOPIFY_PAY: 'Shop Pay',
  ANDROID_PAY: 'Google Pay',
};

// Words that mark a sentence as describing the eligibility/request deadline rather than, say, shipping time.
const WINDOW_WORDS =
  /\b(request|eligible|eligibility|within|from the date|window|period|initiate|accept|allow|you have|to return|must (be )?return|(may|can|could) (be )?return|returned|\d+[\s-]*days?[\s-]+return(s|\s+policy)?\b(?!\s+(shipping|processing|transit|label)))/i;

/**
 * Reads the return window ("30 days" / "30-day") from the refund policy
 * text. Only a duration in a sentence that mentions returns AND describes a
 * deadline counts, and business-day durations (refund processing times) are
 * ignored. If the policy yields more than one distinct window the result is
 * null: omitting the claim is safer than publishing a wrong guarantee.
 */
export function parseReturnWindowDays(policyBody: string | null | undefined): number | null {
  if (!policyBody) return null;
  // Block-level tags become sentence breaks so adjacent paragraphs without end punctuation stay separate sentences.
  const text = policyBody
    .replace(/<\/(p|li|ul|ol|div|h[1-6]|tr|td|th|blockquote)>|<br\s*\/?>/gi, '. ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ');
  const found = new Set<number>();
  for (const sentence of text.split(/(?<=[.!?])\s+/)) {
    if (!/return/i.test(sentence) || !WINDOW_WORDS.test(sentence)) continue;
    for (const match of sentence.matchAll(/\b(\d{1,3})[\s-]*(?:calendar\s+)?days?\b/gi)) {
      const days = Number(match[1]);
      if (days > 0 && days <= 365) found.add(days);
    }
  }
  return found.size === 1 ? [...found][0] : null;
}

/** The promise's value, or null if it rejects or takes longer than `ms` -- optional data must never hold up a page. */
export function withBudget<T>(promise: Promise<T>, ms: number): Promise<T | null> {
  return new Promise((resolve) => {
    const timer = setTimeout(() => resolve(null), ms);
    promise.then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      () => {
        clearTimeout(timer);
        resolve(null);
      },
    );
  });
}

export function paymentMethodLabels(
  cardBrands: readonly string[] | null | undefined,
  wallets: readonly string[] | null | undefined,
): string[] {
  const labels = [
    ...(cardBrands ?? []).map((brand) => CARD_BRAND_LABELS[brand]),
    ...(wallets ?? []).map((wallet) => WALLET_LABELS[wallet]),
  ].filter((label): label is string => Boolean(label));
  return [...new Set(labels)];
}

export const STORE_TRUST_QUERY = `#graphql
  query StoreTrust($country: CountryCode, $language: LanguageCode)
    @inContext(country: $country, language: $language) {
    shop {
      refundPolicy { body url }
      paymentSettings { acceptedCardBrands supportedDigitalWallets }
      brand { logo { image { url } } }
    }
  }
` as const;

interface StoreTrustQueryResult {
  shop?: {
    refundPolicy?: {body?: string | null; url?: string | null} | null;
    paymentSettings?: {acceptedCardBrands?: string[] | null; supportedDigitalWallets?: string[] | null} | null;
    brand?: {logo?: {image?: {url?: string | null} | null} | null} | null;
  } | null;
}

export function toStoreTrust(
  data: StoreTrustQueryResult | null | undefined,
  countries: readonly string[] = [],
): StoreTrust {
  const shop = data?.shop;
  return {
    returnDays: parseReturnWindowDays(shop?.refundPolicy?.body),
    refundPolicyUrl: shop?.refundPolicy?.url ?? null,
    paymentMethods: paymentMethodLabels(
      shop?.paymentSettings?.acceptedCardBrands,
      shop?.paymentSettings?.supportedDigitalWallets,
    ),
    logoUrl: shop?.brand?.logo?.image?.url ?? null,
    returnCountries: [...countries],
  };
}

export const EMPTY_STORE_TRUST: StoreTrust = {
  returnDays: null,
  refundPolicyUrl: null,
  paymentMethods: [],
  logoUrl: null,
  returnCountries: [],
};
