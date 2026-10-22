import type {ActionFunctionArgs, LoaderFunctionArgs} from 'react-router';
import {rateLimitMiddleware} from '~/lib/rate-limit';
import {requireSameOrigin} from '~/lib/security';
import {captureError} from '~/lib/monitoring';
import {subscribeToKlaviyoList} from '~/lib/klaviyo';

/**
 * Newsletter subscribe API route.
 *
 * Accepts email + optional source, subscribes to Klaviyo list.
 * Server-only — keeps Klaviyo API key out of the client bundle.
 *
 * POST /api/newsletter  { email: string, source?: string }
 *
 * Rate limit: 5 requests per minute per IP (spam prevention).
 */
export async function action({request, context}: ActionFunctionArgs) {
  if (request.method !== 'POST') {
    return Response.json({error: 'Method not allowed'}, {status: 405});
  }
  const originError = requireSameOrigin(request);
  if (originError) return originError;

  // Rate limiting — 5 requests per minute per IP
  const rateLimitResponse = rateLimitMiddleware(request, 'newsletter', 5);
  if (rateLimitResponse) return rateLimitResponse;

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
      email = sanitizeEmail(body.email);
      source = sanitizeString(body.source, 50) || 'website';
    } catch {
      return Response.json({error: 'Invalid JSON body'}, {status: 400});
    }
  } else {
    // form-encoded (from fetcher.Form)
    try {
      const formData = await request.formData();
      email = sanitizeString(String(formData.get('email')), 254).trim().toLowerCase();
      source = sanitizeString(String(formData.get('source')), 50) || 'website';
    } catch {
      return Response.json({error: 'Invalid form data'}, {status: 400});
    }
  }

  if (!isValidEmail(email)) {
    return Response.json(
      {error: 'Please enter a valid email address.'},
      {status: 400},
    );
  }

  const apiKey = env.PRIVATE_KLAVIYO_API_KEY;
  const listId = env.PUBLIC_KLAVIYO_LIST_ID;

  // Never simulate success. A storefront must not claim a subscription was
  // recorded when the provider is unavailable or misconfigured.
  if (!apiKey || !listId) {
    captureError(
      new Error('Klaviyo newsletter is not configured'),
      {route: 'api.newsletter', failure: 'configuration'},
    );
    return Response.json(
      {error: 'Newsletter signup is temporarily unavailable.'},
      {status: 503},
    );
  }

  const result = await subscribeToKlaviyoList({
    apiKey,
    listId,
    email,
    source,
  });
  if (!result.ok) {
    captureError(
      result.kind === 'network'
        ? result.error
        : new Error(`Klaviyo returned HTTP ${result.status}`),
      {
        route: 'api.newsletter',
        provider: 'klaviyo',
        failure: result.kind,
        ...(result.kind === 'http' ? {status: result.status} : {}),
      },
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
}

export function loader(_args: LoaderFunctionArgs) {
  return Response.json({error: 'Method not allowed'}, {status: 405});
}

// --- helpers ---

function sanitizeString(input: unknown, maxLength: number = 255): string {
  if (typeof input !== 'string') return '';
  // Trim, strip control characters, cap length
  return input
    .replace(/\p{Cc}/gu, '')
    .trim()
    .slice(0, maxLength);
}

function sanitizeEmail(input: unknown): string {
  if (typeof input !== 'string') return '';
  return input
    .replace(/[\p{Cc}\s]/gu, '')
    .toLowerCase()
    .slice(0, 254);
}

function isValidEmail(email: string): boolean {
  if (!email || email.length > 254) return false;
  // RFC 5322 simplified — sufficient for input validation, not deliverability
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
  return re.test(email);
}
