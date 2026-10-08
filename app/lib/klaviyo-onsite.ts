/**
 * Tracks Klaviyo's on-site forms (popups/flyouts) so our own overlays can
 * yield to them. Klaviyo announces form activity on `window` via the
 * documented `klaviyoForms` CustomEvent (`detail.type === 'open'` when a
 * popup or flyout is shown; embedded forms fire `embedOpen` instead).
 */

/**
 * How long, after Klaviyo starts loading, our own popup waits for a Klaviyo
 * form to open before assuming none will this page view. The live form opens
 * 6s after Klaviyo initialises, and the script itself takes a few seconds on
 * slower connections.
 */
export const KLAVIYO_FORM_GRACE_MS = 12_000;

type Listener = () => void;

let loadStartedAt: number | null = null;
let formOpened = false;
const listeners = new Set<Listener>();

function handleKlaviyoFormsEvent(event: Event) {
  const detail = (event as CustomEvent<{type?: string} | undefined>).detail;
  if (detail?.type !== 'open') return;
  formOpened = true;
  for (const listener of listeners) listener();
}

/** Call when the Klaviyo on-site script is injected. Idempotent. */
export function markKlaviyoOnsiteLoading(now: number = Date.now()) {
  if (typeof window === 'undefined' || loadStartedAt !== null) return;
  loadStartedAt = now;
  window.addEventListener('klaviyoForms', handleKlaviyoFormsEvent);
}

/** Milliseconds left in Klaviyo's grace window; 0 if inactive or elapsed. */
export function klaviyoGraceRemainingMs(now: number = Date.now()): number {
  if (loadStartedAt === null) return 0;
  return Math.max(0, loadStartedAt + KLAVIYO_FORM_GRACE_MS - now);
}

/** Whether a Klaviyo popup/flyout has opened during this page view. */
export function hasKlaviyoFormOpened(): boolean {
  return formOpened;
}

/** Subscribe to Klaviyo popup/flyout opens. Returns an unsubscribe function. */
export function onKlaviyoFormOpen(listener: Listener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/** Test-only: reset module state between tests. */
export function resetKlaviyoOnsiteForTests() {
  if (typeof window !== 'undefined') {
    window.removeEventListener('klaviyoForms', handleKlaviyoFormsEvent);
  }
  loadStartedAt = null;
  formOpened = false;
  listeners.clear();
}
