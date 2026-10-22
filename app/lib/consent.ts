/**
 * Visitor consent model: three independently chosen categories, persisted locally and reconciled with
 * Shopify's Customer Privacy API. Anything undecided is denied.
 *
 * - analytics: GA4
 * - marketing: Meta Pixel, TikTok Pixel, Klaviyo on-site
 * - preferences: not used by a script here; passed through to Shopify
 */

export type ConsentState = {
  analytics: boolean;
  marketing: boolean;
  preferences: boolean;
};

/** Dispatch this window event to reopen the consent choices (the footer's "Cookie preferences" does). */
export const OPEN_COOKIE_PREFERENCES_EVENT = 'lb:open-cookie-preferences';

export const CONSENT_STORAGE_KEY = 'lb_cookie_consent_v2';
// NOTE: the original single-flag record ('accepted' | 'rejected'); read once and migrated.
const LEGACY_STORAGE_KEY = 'lb_cookie_consent';

export const ALL_GRANTED: ConsentState = {analytics: true, marketing: true, preferences: true};
export const ALL_DENIED: ConsentState = {analytics: false, marketing: false, preferences: false};

// Used only when localStorage is unavailable so a choice still holds for the rest of the visit.
let memoryConsent: ConsentState | null = null;

export function sameConsent(a: ConsentState | null, b: ConsentState | null): boolean {
  if (!a || !b) return a === b;
  return a.analytics === b.analytics && a.marketing === b.marketing && a.preferences === b.preferences;
}

function parseStored(raw: string | null): ConsentState | null {
  if (!raw) return null;
  try {
    const value = JSON.parse(raw) as Record<string, unknown>;
    if (
      value &&
      value.v === 2 &&
      typeof value.analytics === 'boolean' &&
      typeof value.marketing === 'boolean' &&
      typeof value.preferences === 'boolean'
    ) {
      return {analytics: value.analytics, marketing: value.marketing, preferences: value.preferences};
    }
  } catch {
    // Corrupt record: treat as undecided.
  }
  return null;
}

export function readConsent(storage?: Pick<Storage, 'getItem'> | null): ConsentState | null {
  try {
    const store = storage ?? (typeof window === 'undefined' ? null : window.localStorage);
    if (!store) return memoryConsent;
    const current = parseStored(store.getItem(CONSENT_STORAGE_KEY));
    if (current) return current;
    const legacy = store.getItem(LEGACY_STORAGE_KEY);
    if (legacy === 'accepted') return {...ALL_GRANTED};
    if (legacy === 'rejected') return {...ALL_DENIED};
    return memoryConsent;
  } catch {
    return memoryConsent;
  }
}

export function writeConsent(state: ConsentState, storage?: Pick<Storage, 'setItem' | 'removeItem'> | null) {
  memoryConsent = {...state};
  try {
    const store = storage ?? (typeof window === 'undefined' ? null : window.localStorage);
    if (!store) return;
    store.setItem(CONSENT_STORAGE_KEY, JSON.stringify({v: 2, ...state}));
    store.removeItem(LEGACY_STORAGE_KEY);
  } catch {
    // Storage unavailable: the in-memory copy keeps this visit consistent; the banner shows again next visit.
  }
}

/** Test hook: forget the in-memory fallback. */
export function resetConsentMemory() {
  memoryConsent = null;
}

type ShopifyValues = Partial<Record<'analytics' | 'marketing' | 'preferences', 'yes' | 'no' | '' | undefined>>;

/**
 * Shopify's recorded choice, or null when it has none. A category Shopify leaves blank is denied rather than
 * inherited, so a partial record can never grant something the visitor did not choose.
 */
export function consentFromShopify(values: ShopifyValues | null | undefined): ConsentState | null {
  if (!values) return null;
  const decided = [values.analytics, values.marketing, values.preferences].some((v) => v === 'yes' || v === 'no');
  if (!decided) return null;
  return {
    analytics: values.analytics === 'yes',
    marketing: values.marketing === 'yes',
    preferences: values.preferences === 'yes',
  };
}

export function consentToShopify(state: ConsentState) {
  return {
    analytics: state.analytics,
    marketing: state.marketing,
    preferences: state.preferences,
    sale_of_data: false,
  };
}

export type ReconcileResult =
  | {action: 'none'}
  | {action: 'adopt'; state: ConsentState}
  | {action: 'push'; state: ConsentState};

/**
 * Shopify wins when it has a decision that differs (a later rejection or revocation made elsewhere);
 * our stored choice is pushed to Shopify only when Shopify has none.
 */
export function reconcileConsent(stored: ConsentState | null, shopify: ConsentState | null): ReconcileResult {
  if (shopify && !sameConsent(shopify, stored)) return {action: 'adopt', state: shopify};
  if (stored && !shopify) return {action: 'push', state: stored};
  return {action: 'none'};
}
