import type {ActionFunctionArgs, LoaderFunctionArgs} from 'react-router';
import {rateLimitMiddleware} from '~/lib/rate-limit';
import {requireSameOrigin} from '~/lib/security';

/**
 * AI chat widget API route — POST /api/chat  { message: string, history?: ChatTurn[] }
 *
 * Storefront Q&A / product-finder only: grounds every reply in a live
 * Storefront API product search plus a fixed set of real store facts (see
 * SYSTEM_PROMPT below). It never touches orders, customer data, or checkout,
 * and is not told anything it could use to fabricate those.
 *
 * Server-only — keeps the Anthropic API key out of the client bundle.
 * Degrades to a clean 503 (not a crash or a simulated reply) when
 * PRIVATE_ANTHROPIC_API_KEY is unset.
 *
 * Rate limit: 15 requests per minute per IP (LLM calls cost money per call).
 */

interface ChatTurn {
  role: 'user' | 'assistant';
  content: string;
}

// Forwarding a full sentence straight into Shopify's products(query:) search
// treats every word as a literal search term, so filler words in a normal
// question ("Do you have any hoodies?") often prevent a match that a plain
// keyword search ("hoodies") would find. Stripped down to the words most
// likely to be product-relevant before it ever reaches the Storefront API.
const SEARCH_STOPWORDS = new Set([
  'a', 'an', 'the', 'is', 'are', 'am', 'was', 'were', 'be', 'been', 'being',
  'do', 'does', 'did', 'have', 'has', 'had', 'i', 'you', 'he', 'she', 'it',
  'we', 'they', 'my', 'your', 'his', 'her', 'its', 'our', 'their', 'me',
  'him', 'us', 'them', 'this', 'that', 'these', 'those', 'to', 'of', 'in',
  'on', 'at', 'for', 'with', 'about', 'any', 'some', 'and', 'or', 'but',
  'can', 'could', 'would', 'should', 'will', 'want', 'looking', 'need',
  'like', 'please', 'hi', 'hello', 'hey', 'thanks', 'thank', 'got', 'get',
  'show', 'find', 'there', 'what', 'where', 'when', 'how', 'if',
]);

function extractSearchKeywords(message: string): string {
  const words = message
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((word) => word.length > 1 && !SEARCH_STOPWORDS.has(word));

  // Dedupe while preserving order, cap at a handful of terms so the query
  // stays focused on the most product-relevant words in a longer message.
  const keywords = [...new Set(words)].slice(0, 6);

  // If everything got filtered out (e.g. a message that's all stopwords),
  // fall back to the raw message rather than sending an empty query.
  return keywords.length > 0 ? keywords.join(' ') : message;
}

const MAX_MESSAGE_LENGTH = 500;
const MAX_HISTORY_TURNS = 6;
const ANTHROPIC_MODEL = 'claude-haiku-4-5-20251001';
const ANTHROPIC_TIMEOUT_MS = 15_000;

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

const SYSTEM_PROMPT = `You are the storefront assistant for Legendary Branding, a premium streetwear brand (legendary-branding.com).

Scope -- stay strictly within this:
- Help visitors find products, understand sizing/materials, and answer policy/FAQ questions.
- Use ONLY the "Relevant products" data given to you below for anything about specific items, prices, or availability. If nothing relevant was found, say so and suggest browsing the collection instead of guessing.
- Never invent prices, stock levels, discounts, or product details not given to you.
- You have NO access to order status, order history, payment methods, or any customer account data. If asked about an existing order, say you can't look that up and point them to legendary-branding.com/policies/contact or their order confirmation email.
- Never discuss or promise changes to checkout, payments, taxes, or shipping costs beyond what is in the policy pages.
- Collections available: Accessories & More, Hoodies & Jackets, Shirts & Tops, All Products, Sets, Marque Legendaire (luxury), Legendary Select.
- Price range storewide: $55-$120 USD.
- Policy pages exist at /policies/refund-policy, /policies/terms-of-service, /policies/privacy-with-legendary-branding, /policies/shipping-policy, /policies/size-guide, /policies/about, /policies/contact, /policies/legendary_branding_faqs -- point users there for anything policy-specific you're not fully sure of.
- Keep replies short (2-4 sentences), plain text (no markdown), friendly but concise. When recommending a product, mention its name and that it can be found by searching for it on the site.`;

export async function action({request, context}: ActionFunctionArgs) {
  if (request.method !== 'POST') {
    return Response.json({error: 'Method not allowed'}, {status: 405});
  }
  const originError = requireSameOrigin(request);
  if (originError) return originError;

  const rateLimitResponse = rateLimitMiddleware(request, 'chat', 15);
  if (rateLimitResponse) return rateLimitResponse;

  let message = '';
  let history: ChatTurn[] = [];

  try {
    const body = (await request.json()) as {message?: unknown; history?: unknown};
    message = sanitizeMessage(body.message);
    history = sanitizeHistory(body.history);
  } catch {
    return Response.json({error: 'Invalid JSON body'}, {status: 400});
  }

  if (!message) {
    return Response.json(
      {error: 'Please enter a message.'},
      {status: 400},
    );
  }

  const apiKey = context.env.PRIVATE_ANTHROPIC_API_KEY;

  // Never simulate a reply. A chat widget must not pretend to work when the
  // provider is unavailable or misconfigured.
  if (!apiKey) {
    console.error('[chat] PRIVATE_ANTHROPIC_API_KEY is not configured');
    return Response.json(
      {error: 'Chat is temporarily unavailable.'},
      {status: 503},
    );
  }

  let productContext = 'No matching products found.';
  try {
    const data = await context.storefront.query(PRODUCT_SEARCH_QUERY, {
      variables: {
        query: extractSearchKeywords(message),
        country: context.storefront.i18n.country,
        language: context.storefront.i18n.language,
      },
    });
    const nodes = (data.products?.nodes ?? []) as Array<{
      title: string;
      handle: string;
      availableForSale: boolean;
      priceRange: {minVariantPrice: {amount: string; currencyCode: string}};
    }>;
    if (nodes.length > 0) {
      productContext = nodes
        .map(
          (p) =>
            `- ${p.title} (/products/${p.handle}) -- ${p.priceRange.minVariantPrice.amount} ${p.priceRange.minVariantPrice.currencyCode}, ${p.availableForSale ? 'in stock' : 'currently sold out'}`,
        )
        .join('\n');
    }
  } catch (error) {
    console.error('[chat] Product search error:', error);
    // Fall through with the "no matching products" default -- a search
    // failure shouldn't block the assistant from answering general questions.
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), ANTHROPIC_TIMEOUT_MS);

  try {
    const anthropicResponse = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: ANTHROPIC_MODEL,
        max_tokens: 300,
        system: `${SYSTEM_PROMPT}\n\nRelevant products for this message:\n${productContext}`,
        messages: [
          ...history.map((turn) => ({role: turn.role, content: turn.content})),
          {role: 'user', content: message},
        ],
      }),
      signal: controller.signal,
    });

    if (!anthropicResponse.ok) {
      const errorText = await anthropicResponse.text();
      console.error(`[chat] Anthropic API error ${anthropicResponse.status}: ${errorText}`);
      return Response.json(
        {error: 'Something went wrong. Please try again.'},
        {status: 502},
      );
    }

    const result = (await anthropicResponse.json()) as {
      content?: Array<{type: string; text?: string}>;
    };
    const reply = result.content?.find((block) => block.type === 'text')?.text?.trim();

    if (!reply) {
      console.error('[chat] Anthropic response had no text content');
      return Response.json(
        {error: 'Something went wrong. Please try again.'},
        {status: 502},
      );
    }

    return Response.json({reply});
  } catch (err) {
    const isAbort = err instanceof Error && err.name === 'AbortError';
    console.error(isAbort ? '[chat] Anthropic request timed out' : '[chat] Network error calling Anthropic:', isAbort ? '' : err);
    return Response.json(
      {error: 'Something went wrong. Please try again.'},
      {status: 502},
    );
  } finally {
    clearTimeout(timeout);
  }
}

export function loader(_args: LoaderFunctionArgs) {
  return Response.json({error: 'Method not allowed'}, {status: 405});
}

// --- helpers ---

function sanitizeMessage(input: unknown): string {
  if (typeof input !== 'string') return '';
  return input
    .replace(/[\u0000-\u001F\u007F-\u009F]/g, '')
    .trim()
    .slice(0, MAX_MESSAGE_LENGTH);
}

function sanitizeHistory(input: unknown): ChatTurn[] {
  if (!Array.isArray(input)) return [];
  const turns: ChatTurn[] = [];
  for (const entry of input) {
    if (
      entry &&
      typeof entry === 'object' &&
      (entry.role === 'user' || entry.role === 'assistant') &&
      typeof entry.content === 'string'
    ) {
      turns.push({
        role: entry.role,
        content: sanitizeMessage(entry.content),
      });
    }
  }
  return turns.slice(-MAX_HISTORY_TURNS).filter((turn) => turn.content.length > 0);
}
