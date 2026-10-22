const KLAVIYO_SUBSCRIBE_URL =
  'https://a.klaviyo.com/api/profile-subscription-bulk-create-jobs/';
const KLAVIYO_REVISION = '2024-02-15';
const REQUEST_TIMEOUT_MS = 8_000;

interface SubscribeToKlaviyoListInput {
  apiKey: string;
  listId: string;
  email: string;
  source: string;
}

export type KlaviyoSubscribeResult =
  | {ok: true}
  | {ok: false; kind: 'http'; status: number}
  | {ok: false; kind: 'network'; error: unknown};

/**
 * Submit an email marketing subscription to a Klaviyo list.
 *
 * `{ok: true}` means Klaviyo ACCEPTED the job (HTTP 202). The subscription is
 * processed asynchronously and, on a double opt-in list, only completes once
 * the shopper confirms by email.
 *
 * Callers must validate and normalize user input before calling this helper.
 * Provider response bodies are deliberately not read or logged because they
 * can contain subscriber data. Requests are bounded so provider stalls do not
 * hold a storefront action open indefinitely.
 */
export async function subscribeToKlaviyoList(
  input: SubscribeToKlaviyoListInput,
): Promise<KlaviyoSubscribeResult> {
  // NOTE: revision 2024-02-15 takes the profiles at data.attributes.profiles.data;
  // a top-level `included` array is ignored. Profile `properties` are not part
  // of this contract, so none are sent.
  const body = {
    data: {
      type: 'profile-subscription-bulk-create-job',
      attributes: {
        custom_source: input.source,
        profiles: {
          data: [
            {
              type: 'profile',
              attributes: {
                email: input.email,
                subscriptions: {email: {marketing: {consent: 'SUBSCRIBED'}}},
              },
            },
          ],
        },
      },
      relationships: {
        list: {data: {type: 'list', id: input.listId}},
      },
    },
  };

  try {
    const response = await fetch(KLAVIYO_SUBSCRIBE_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/vnd.api+json',
        revision: KLAVIYO_REVISION,
        Authorization: `Klaviyo-API-Key ${input.apiKey}`,
      },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });

    return response.ok
      ? {ok: true}
      : {ok: false, kind: 'http', status: response.status};
  } catch (error) {
    return {ok: false, kind: 'network', error};
  }
}

const KLAVIYO_BACK_IN_STOCK_URL = 'https://a.klaviyo.com/api/back-in-stock-subscriptions/';

interface RequestKlaviyoBackInStockInput {
  apiKey: string;
  email: string;
  /** Numeric Shopify variant ID (the tail of the ProductVariant GID). */
  shopifyVariantId: string;
}

/**
 * Register a per-variant back-in-stock request. This is separate from
 * marketing consent: it subscribes the profile only to restock notices for
 * that one variant. `{ok: true}` means the request was accepted (HTTP 202);
 * delivery depends on the account's Back in Stock flow, which this call
 * cannot confirm.
 */
export async function requestKlaviyoBackInStock(
  input: RequestKlaviyoBackInStockInput,
): Promise<KlaviyoSubscribeResult> {
  const body = {
    data: {
      type: 'back-in-stock-subscription',
      attributes: {
        channels: ['EMAIL'],
        profile: {data: {type: 'profile', attributes: {email: input.email}}},
      },
      relationships: {
        variant: {
          data: {type: 'catalog-variant', id: `$shopify:::$default:::${input.shopifyVariantId}`},
        },
      },
    },
  };

  try {
    const response = await fetch(KLAVIYO_BACK_IN_STOCK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/vnd.api+json',
        revision: KLAVIYO_REVISION,
        Authorization: `Klaviyo-API-Key ${input.apiKey}`,
      },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });
    return response.ok ? {ok: true} : {ok: false, kind: 'http', status: response.status};
  } catch (error) {
    return {ok: false, kind: 'network', error};
  }
}
