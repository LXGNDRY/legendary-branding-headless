import type {ActionFunctionArgs, LoaderFunctionArgs} from 'react-router';

/**
 * Newsletter subscribe API route.
 *
 * Accepts email + optional source, subscribes to Klaviyo list.
 * Server-only — keeps Klaviyo API key out of the client bundle.
 *
 * POST /api/newsletter  { email: string, source?: string }
 */
export async function action({request, context}: ActionFunctionArgs) {
  if (request.method !== 'POST') {
    return Response.json({error: 'Method not allowed'}, {status: 405});
  }

  const env = context.env as {
    PRIVATE_KLAVIYO_API_KEY?: string;
    PUBLIC_KLAVIYO_LIST_ID?: string;
  };

  let email = '';
  let source = 'website';

  const contentType = request.headers.get('content-type') || '';

  if (contentType.includes('application/json')) {
    try {
      const body = (await request.json()) as {email?: string; source?: string};
      email = (body.email || '').trim().toLowerCase();
      source = body.source || 'website';
    } catch {
      return Response.json({error: 'Invalid JSON body'}, {status: 400});
    }
  } else {
    // form-encoded (from fetcher.Form)
    try {
      const formData = await request.formData();
      email = String(formData.get('email') || '').trim().toLowerCase();
      source = String(formData.get('source') || 'website');
    } catch {
      return Response.json({error: 'Invalid form data'}, {status: 400});
    }
  }

  if (!email || !email.includes('@') || !email.includes('.')) {
    return Response.json(
      {error: 'Please enter a valid email address.'},
      {status: 400},
    );
  }

  const apiKey = env.PRIVATE_KLAVIYO_API_KEY;
  const listId = env.PUBLIC_KLAVIYO_LIST_ID;

  // If Klaviyo is not configured, return success (graceful degradation).
  // In dev / preview environments, emails are logged server-side but not sent.
  if (!apiKey || !listId) {
    console.info(
      `[newsletter] Klaviyo not configured — would subscribe ${email} (source: ${source})`,
    );
    return Response.json({
      success: true,
      subscribed: true,
      message: "You're in. Watch your inbox.",
      simulated: true,
    });
  }

  try {
    const klaviyoResponse = await fetch('https://a.klaviyo.com/api/profile-subscription-bulk-create-jobs/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/vnd.api+json',
        revision: '2024-02-15',
        Authorization: `Klaviyo-API-Key ${apiKey}`,
      },
      body: JSON.stringify({
        data: {
          type: 'profile-subscription-bulk-create-job',
          attributes: {
            custom_source: source,
          },
          relationships: {
            list: {
              data: {
                type: 'list',
                id: listId,
              },
            },
          },
        },
        included: [
          {
            type: 'profile',
            attributes: {
              email,
              subscriptions: {
                email: {
                  marketing: {
                    consent: 'SUBSCRIBED',
                  },
                },
              },
            },
          },
        ],
      }),
    });

    if (!klaviyoResponse.ok) {
      const errorText = await klaviyoResponse.text();
      console.error(
        `[newsletter] Klaviyo API error ${klaviyoResponse.status}: ${errorText}`,
      );
      return Response.json(
        {error: 'Something went wrong. Please try again later.'},
        {status: 502},
      );
    }

    return Response.json({
      success: true,
      subscribed: true,
      message: "You're in. Watch your inbox.",
    });
  } catch (err) {
    console.error('[newsletter] Network error calling Klaviyo:', err);
    return Response.json(
      {error: 'Something went wrong. Please try again later.'},
      {status: 502},
    );
  }
}

export function loader(_args: LoaderFunctionArgs) {
  return Response.json({error: 'Method not allowed'}, {status: 405});
}
