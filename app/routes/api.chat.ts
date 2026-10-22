import type {ActionFunctionArgs, LoaderFunctionArgs} from 'react-router';
import {enforceRatePolicy} from '~/lib/rate-limit';
import {CacheLong} from '~/lib/cache';
import {optional} from '~/lib/optional';
import {
  CHAT_CONTEXT_BUDGET_MS,
  CHAT_DEADLINE_MS,
  CHAT_MAX_BODY_BYTES,
  CHAT_MAX_OUTPUT_TOKENS,
  CHAT_MODEL,
  chatReadiness,
} from '~/lib/chat-policy';
import {
  buildSystemPrompt,
  extractSearchKeywords,
  sanitizeHistory,
  sanitizeMessage,
  type StoreFacts,
} from '~/lib/chat-grounding';
import {requireSameOrigin} from '~/lib/security';

/**
 * AI chat widget API route — POST /api/chat  { message: string, history?: ChatTurn[] }
 *
 * Storefront Q&A / product-finder only: grounds every reply in a live
 * Storefront API product search plus live store facts (collections, price range) read per request
 * (see chat-grounding.ts). It never touches orders, customer data, or checkout,
 * and is not told anything it could use to fabricate those.
 *
 * Server-only — keeps the Anthropic API key out of the client bundle.
 * Degrades to a clean 503 (not a crash or a simulated reply) when
 * PRIVATE_ANTHROPIC_API_KEY is unset.
 *
 * Protection: named per-client and per-isolate limits (see rate-limit.ts; local layer only), a request body
 * cap, one total deadline, and a provider-readiness check. Shared spend control: docs/CHAT_PROTECTION.md.
 */

const PRODUCT_SEARCH_QUERY = `#graphql
  query ChatProductSearch($query: String!, $country: CountryCode, $language: LanguageCode)
    @inContext(country: $country, language: $language) {
    products(first: 5, query: $query) {
      nodes {
        title
        handle
        availableForSale
        priceRange {
          minVariantPrice { amount currencyCode }
        }
      }
    }
  }
` as const;

// Collections and the price range are read live so a catalog or price change never needs a prompt edit.
const STORE_FACTS_QUERY = `#graphql
  query ChatStoreFacts($country: CountryCode, $language: LanguageCode)
    @inContext(country: $country, language: $language) {
    collections(first: 20, sortKey: TITLE) {
      nodes { title handle }
    }
    cheapest: products(first: 1, sortKey: PRICE) {
      nodes { priceRange { minVariantPrice { amount currencyCode } } }
    }
    priciest: products(first: 1, sortKey: PRICE, reverse: true) {
      nodes { priceRange { maxVariantPrice { amount currencyCode } } }
    }
  }
` as const;

type Money = {amount: string; currencyCode: string};

function factsFrom(data: {
  collections?: {nodes?: Array<{title: string; handle: string}>} | null;
  cheapest?: {nodes?: Array<{priceRange?: {minVariantPrice?: Money}}>} | null;
  priciest?: {nodes?: Array<{priceRange?: {maxVariantPrice?: Money}}>} | null;
}): StoreFacts {
  const min = data.cheapest?.nodes?.[0]?.priceRange?.minVariantPrice;
  const max = data.priciest?.nodes?.[0]?.priceRange?.maxVariantPrice;
  return {
    collections: data.collections?.nodes ?? [],
    ...(min && max ? {priceRange: {min, max}} : {}),
  };
}

const GENERIC_FAILURE = 'Something went wrong. Please try again.';

/** Logs the provider failure without its body: it can echo request content. */
async function providerErrorType(response: Response): Promise<string> {
  try {
    const body = (await response.json()) as {error?: {type?: unknown}};
    const type = body.error?.type;
    return typeof type === 'string' && /^[a-z_]{1,64}$/.test(type) ? type : 'unknown';
  } catch {
    return 'unknown';
  }
}

export async function action({request, context}: ActionFunctionArgs) {
  if (request.method !== 'POST') {
    return Response.json({error: 'Method not allowed'}, {status: 405});
  }
  const originError = requireSameOrigin(request);
  if (originError) return originError;

  // Never simulate a reply. A chat widget must not pretend to work when the provider is unavailable.
  const readiness = chatReadiness(context.env);
  if (!readiness.available) {
    console.error('[chat] unavailable:', readiness.reason);
    return Response.json({error: 'Chat is temporarily unavailable.'}, {status: 503});
  }
  const apiKey = context.env.PRIVATE_ANTHROPIC_API_KEY as string;

  const rateLimitResponse = enforceRatePolicy(request, 'chat', 'chat-hourly', 'chat-global');
  if (rateLimitResponse) return rateLimitResponse;

  let message = '';
  let history: ReturnType<typeof sanitizeHistory> = [];

  try {
    const declared = Number(request.headers.get('content-length'));
    if (Number.isFinite(declared) && declared > CHAT_MAX_BODY_BYTES) {
      return Response.json({error: 'Message is too long.'}, {status: 413});
    }
    // NOTE: content-length is optional (chunked bodies), so the size is checked on the bytes actually read.
    const raw = await request.text();
    if (new TextEncoder().encode(raw).byteLength > CHAT_MAX_BODY_BYTES) {
      return Response.json({error: 'Message is too long.'}, {status: 413});
    }
    const body = JSON.parse(raw) as {message?: unknown; history?: unknown};
    message = sanitizeMessage(body.message);
    history = sanitizeHistory(body.history);
  } catch {
    return Response.json({error: 'Invalid JSON body'}, {status: 400});
  }

  if (!message) {
    return Response.json({error: 'Please enter a message.'}, {status: 400});
  }

  // One deadline covers the store lookups and the provider call.
  const controller = new AbortController();
  const deadline = setTimeout(() => controller.abort(), CHAT_DEADLINE_MS);

  try {
    const variables = {country: context.storefront.i18n.country, language: context.storefront.i18n.language};
    const [productContext, facts] = await Promise.all([
      optional(
        'chat.products',
        async () => {
          const data = await context.storefront.query(PRODUCT_SEARCH_QUERY, {
            variables: {query: extractSearchKeywords(message), ...variables},
          });
          const nodes = (data.products?.nodes ?? []) as Array<{
            title: string;
            handle: string;
            availableForSale: boolean;
            priceRange: {minVariantPrice: Money};
          }>;
          return nodes.length > 0
            ? nodes
                .map(
                  (p) =>
                    `- ${p.title} (/products/${p.handle}) -- ${p.priceRange.minVariantPrice.amount} ${p.priceRange.minVariantPrice.currencyCode}, ${p.availableForSale ? 'in stock' : 'currently sold out'}`,
                )
                .join('\n')
            : 'No matching products found.';
        },
        {ms: CHAT_CONTEXT_BUDGET_MS, fallback: 'No matching products found.'},
      ),
      optional(
        'chat.facts',
        async () => factsFrom(await context.storefront.query(STORE_FACTS_QUERY, {variables, cache: CacheLong()})),
        {ms: CHAT_CONTEXT_BUDGET_MS, fallback: null as StoreFacts | null},
      ),
    ]);

    const anthropicResponse = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: CHAT_MODEL,
        max_tokens: CHAT_MAX_OUTPUT_TOKENS,
        system: buildSystemPrompt(facts, productContext),
        messages: [...history, {role: 'user', content: message}],
      }),
      signal: controller.signal,
    });

    if (!anthropicResponse.ok) {
      console.error(`[chat] provider error status=${anthropicResponse.status} type=${await providerErrorType(anthropicResponse)}`);
      return Response.json({error: GENERIC_FAILURE}, {status: 502});
    }

    const result = (await anthropicResponse.json()) as {content?: Array<{type: string; text?: string}>};
    const reply = result.content?.find((block) => block.type === 'text')?.text?.trim();

    if (!reply) {
      console.error('[chat] provider response had no text content');
      return Response.json({error: GENERIC_FAILURE}, {status: 502});
    }

    return Response.json({reply});
  } catch (err) {
    const isAbort = err instanceof Error && err.name === 'AbortError';
    console.error(isAbort ? '[chat] request exceeded its deadline' : `[chat] request failed: ${err instanceof Error ? err.name : 'unknown'}`);
    return Response.json({error: GENERIC_FAILURE}, {status: isAbort ? 504 : 502});
  } finally {
    clearTimeout(deadline);
  }
}

export function loader(_args: LoaderFunctionArgs) {
  return Response.json({error: 'Method not allowed'}, {status: 405});
}
