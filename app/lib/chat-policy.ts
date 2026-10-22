/**
 * Reviewed policy for the paid storefront chat: model, budgets and readiness live here, not inside the route.
 * Changing a number here changes cost exposure, so review it as such.
 */

export const CHAT_MODEL = 'claude-haiku-4-5-20251001';
export const CHAT_MAX_OUTPUT_TOKENS = 300;

export const CHAT_MAX_MESSAGE_CHARS = 500;
export const CHAT_MAX_HISTORY_TURNS = 6;
/** Hard ceiling on the request body, checked before it is parsed. */
export const CHAT_MAX_BODY_BYTES = 8_192;

/** Total time one chat request may take, store lookups plus the provider call. */
export const CHAT_DEADLINE_MS = 20_000;
/** Store facts and product search are context, never a reason to stall the reply. */
export const CHAT_CONTEXT_BUDGET_MS = 2_500;

export type ChatReadiness = {available: boolean; reason?: 'provider-not-configured'};

/** The feature is available only when its provider key is configured. */
export function chatReadiness(env: {PRIVATE_ANTHROPIC_API_KEY?: string | undefined}): ChatReadiness {
  return env.PRIVATE_ANTHROPIC_API_KEY ? {available: true} : {available: false, reason: 'provider-not-configured'};
}
