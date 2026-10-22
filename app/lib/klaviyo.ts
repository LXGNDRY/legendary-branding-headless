const KLAVIYO_SUBSCRIBE_URL =
  'https://a.klaviyo.com/api/profile-subscription-bulk-create-jobs/';
const KLAVIYO_REVISION = '2024-02-15';
const REQUEST_TIMEOUT_MS = 8_000;

interface SubscribeToKlaviyoListInput {
  apiKey: string;
  listId: string;
  email: string;
  source: string;
  properties?: Record<string, string>;
}

export type KlaviyoSubscribeResult =
  | {ok: true}
  | {ok: false; kind: 'http'; status: number}
  | {ok: false; kind: 'network'; error: unknown};

/**
 * Submit an email marketing subscription to a Klaviyo list.
 *
 * Callers must validate and normalize user input before calling this helper.
 * Provider response bodies are deliberately not read or logged because they
 * can contain subscriber data. Requests are bounded so provider stalls do not
 * hold a storefront action open indefinitely.
 */
export async function subscribeToKlaviyoList(
  input: SubscribeToKlaviyoListInput,
): Promise<KlaviyoSubscribeResult> {
  const attributes = {
    email: input.email,
    ...(input.properties && Object.keys(input.properties).length > 0
      ? {properties: input.properties}
      : {}),
    subscriptions: {
      email: {
        marketing: {consent: 'SUBSCRIBED'},
      },
    },
  };

  const body = {
    data: {
      type: 'profile-subscription-bulk-create-job',
      attributes: {custom_source: input.source},
      relationships: {
        list: {
          data: {type: 'list', id: input.listId},
        },
      },
    },
    included: [{type: 'profile', attributes}],
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
