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

/**
 * Finds the return window ("30 days" / "30-day") in the refund policy text:
 * the first day count in a sentence that also mentions returns, so other
 * counts such as processing times aren't mistaken for it.
 */
export function parseReturnWindowDays(policyBody: string | null | undefined): number | null {
  if (!policyBody) return null;
  const text = policyBody.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ');
  for (const sentence of text.split(/(?<=[.!?])\s+/)) {
    if (!/return/i.test(sentence)) continue;
    const match = /\b(\d{1,3})[\s-]*(?:calendar\s+|business\s+)?days?\b/i.exec(sentence);
    const days = match ? Number(match[1]) : 0;
    if (days > 0 && days <= 365) return days;
  }
  return null;
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

export function toStoreTrust(data: StoreTrustQueryResult | null | undefined): StoreTrust {
  const shop = data?.shop;
  return {
    returnDays: parseReturnWindowDays(shop?.refundPolicy?.body),
    refundPolicyUrl: shop?.refundPolicy?.url ?? null,
    paymentMethods: paymentMethodLabels(
      shop?.paymentSettings?.acceptedCardBrands,
      shop?.paymentSettings?.supportedDigitalWallets,
    ),
    logoUrl: shop?.brand?.logo?.image?.url ?? null,
  };
}

export const EMPTY_STORE_TRUST: StoreTrust = {
  returnDays: null,
  refundPolicyUrl: null,
  paymentMethods: [],
  logoUrl: null,
};
