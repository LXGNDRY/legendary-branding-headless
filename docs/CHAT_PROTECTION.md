# Chat protection and spend controls

The storefront chat (`app/routes/api.chat.ts`) calls a paid model on every message. This is what protects it today,
what it cannot do, and the decision the owner still has to make.

## What the code enforces (local layer)

| Control | Where | Value |
|---|---|---|
| Per-client limit | `RATE_POLICIES.chat` | 15 / minute |
| Per-client hourly limit | `RATE_POLICIES['chat-hourly']` | 60 / hour |
| Per-isolate ceiling | `RATE_POLICIES['chat-global']` | 600 / hour (one bucket) |
| Body cap | `CHAT_MAX_BODY_BYTES` | 8 KB, checked by header and by bytes read |
| Message / history | `chat-policy.ts` | 500 chars; last 6 turns, validated and alternating |
| Output budget | `CHAT_MAX_OUTPUT_TOKENS` | 300 |
| Total deadline | `CHAT_DEADLINE_MS` | 20 s for store lookups plus the provider call (504 on expiry) |
| Context budget | `CHAT_CONTEXT_BUDGET_MS` | 2.5 s each for product search and store facts |
| Readiness | `chatReadiness` | no `PRIVATE_ANTHROPIC_API_KEY` means the route returns 503 and the widget is not rendered |

Store facts (collections, price range) are read live per request (long-cached); the prompt holds no catalog data.
Earlier turns are marked untrusted in the prompt. Provider error bodies are never logged (status and error type only).

## What it cannot do

- State is **per worker isolate** and resets when an isolate is recycled. Across the fleet the effective limit is roughly
  the limit times the number of live isolates. The 600/hour ceiling is a soft guard, not a cap.
- Client identity comes from `cf-connecting-ip`, which Cloudflare sets and overwrites at the edge. `x-forwarded-for` and
  `x-real-ip` are consulted only when that header is absent (local dev, tests). A request with no usable identity shares
  one bucket; the user agent is never used.
- Nothing here limits provider **spend**. A determined caller spread over many isolates and addresses can exceed these numbers.

## Owner decision: a shared control (pick one)

| Option | Pros | Cons |
|---|---|---|
| 1. Provider-side spend limit in the Anthropic console (workspace monthly cap + usage alerts) | Real hard cap on cost; no code; no new Shopify/Oxygen cost | Cuts chat off for everyone when reached; does not stop abusive traffic itself |
| 2. Edge rate-limit rule on `POST /api/chat` (Cloudflare/Oxygen if the plan exposes it) | Shared across isolates; stops abuse before it reaches the worker | Availability depends on plan; configured outside this repo |
| 3. Shared counter binding (KV / Durable Object) used by `checkRateLimit` | Accurate global limit in code | Paid binding and new infrastructure; needs authorization |

**Recommendation:** option 1 now (it is the only one that bounds money), plus option 2 if available. Do not provision a paid
binding without sign-off. Until a choice is made and evidenced, treat the limits above as best effort. If cost exposure is
not acceptable meanwhile, unset `PRIVATE_ANTHROPIC_API_KEY`: the widget disappears and the route returns 503.

**Evidence to attach when done:** a screenshot or export of the provider cap and alert settings, and/or the edge rule, with the date.
