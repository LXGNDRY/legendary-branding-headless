import {useEffect, useState} from 'react';
import {Link} from 'react-router';
import type {ActiveDiscount} from '~/lib/discounts';
import {useFocusTrap} from '~/hooks/useFocusTrap';
import {useBodyScrollLock, isBodyScrollLocked} from '~/hooks/useBodyScrollLock';

/** How long after page load the popup appears, once eligible to show at all. */
const SHOW_DELAY_MS = 5000;

/**
 * How long a repeat visitor goes without seeing the popup again after it's
 * shown once, tracked per-browser via localStorage. Tune this if the owner
 * wants a more/less aggressive cadence -- 24h means at most once per day,
 * regardless of how many pages they browse or how often they return that day.
 */
const REPEAT_SUPPRESS_MS = 24 * 60 * 60 * 1000;

const STORAGE_KEY = 'lb_discounts_popup_last_shown';

function readLastShown(): number | null {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? Number(raw) : null;
  } catch {
    // Private browsing / storage disabled -- degrade to "show every visit"
    // rather than throwing.
    return null;
  }
}

function writeLastShown(timestamp: number) {
  try {
    window.localStorage.setItem(STORAGE_KEY, String(timestamp));
  } catch {
    // Same as above -- storage not being writable isn't fatal to the popup.
  }
}

function CloseIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
      <path d="M5 5l10 10M15 5L5 15" strokeLinecap="round" />
    </svg>
  );
}

/**
 * A dismissible, delayed popup announcing the shop's real active Shopify
 * discounts (see ~/lib/discounts.ts for what counts as safe to advertise
 * publicly). Appears once per `REPEAT_SUPPRESS_MS` window per browser, and
 * only when there's at least one discount to show -- never renders an empty
 * or placeholder popup.
 */
export default function DiscountsPopup({discounts}: {discounts: ActiveDiscount[]}) {
  const [open, setOpen] = useState(false);
  const {containerRef} = useFocusTrap(open, () => setOpen(false));

  useEffect(() => {
    if (discounts.length === 0) return;
    if (readLastShown() !== null && Date.now() - readLastShown()! < REPEAT_SUPPRESS_MS) return;

    let cancelled = false;
    let timer: ReturnType<typeof setTimeout>;

    function attemptOpen() {
      if (cancelled) return;
      // Other open tabs share this browser's localStorage -- re-check the
      // suppression window here (not just once at the top of the effect),
      // since another tab can write a fresh timestamp (by showing its own
      // copy of this popup) while this tab was waiting out either the
      // initial delay or the overlay-busy retry loop below.
      const lastShown = readLastShown();
      if (lastShown && Date.now() - lastShown < REPEAT_SUPPRESS_MS) return;
      // The cart drawer, mobile menu, and size guide modal all hold the
      // shared body-scroll lock while open -- if one of those is already
      // up, wait rather than stacking a second focus-trapped overlay (and
      // its higher z-index) on top of it.
      if (isBodyScrollLocked()) {
        timer = setTimeout(attemptOpen, 1000);
        return;
      }
      setOpen(true);
      writeLastShown(Date.now());
    }

    timer = setTimeout(attemptOpen, SHOW_DELAY_MS);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
    // discounts.length is a reasonable proxy for "the discount set changed"
    // without re-triggering the timer on every re-render of the array.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [discounts.length]);

  // Shares the module-level lock count with every other overlay (cart
  // drawer, mobile menu, size guide modal) -- see useBodyScrollLock's own
  // comment for why a naive per-component save/restore isn't safe once two
  // overlays can be open at once (e.g. an in-flight add-to-cart opening the
  // cart drawer while this popup is still showing).
  useBodyScrollLock(open);

  // A loader revalidation can replace a non-empty discount list with an
  // empty one (the promotion expired, or the optional Admin API fetch
  // started failing) while the popup is already open -- without this, the
  // render guard below would unmount the dialog but the scroll-lock effect
  // above stays keyed on a now-stale `open: true`, leaving body scroll
  // locked with nothing visible to unlock it.
  useEffect(() => {
    if (discounts.length === 0) setOpen(false);
  }, [discounts.length]);

  if (!open || discounts.length === 0) return null;

  return (
    <div className="fixed inset-0 z-[600] flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/60"
        aria-hidden="true"
        onClick={() => setOpen(false)}
      />
      <div
        ref={containerRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="discounts-popup-heading"
        className="relative z-10 flex max-h-[85vh] w-full max-w-md flex-col overflow-y-auto rounded-lg border border-[var(--color-border-medium)] bg-[var(--color-bg-level-0)] p-6 shadow-2xl"
      >
        <button
          type="button"
          onClick={() => setOpen(false)}
          aria-label="Close"
          className="absolute top-4 right-4 flex h-9 w-9 items-center justify-center rounded-full text-[var(--color-text-secondary)] transition-colors hover:bg-[var(--color-bg-level-2)] hover:text-[var(--color-text-primary)]"
        >
          <CloseIcon />
        </button>

        <p className="h-eyebrow mb-2 text-[var(--color-accent)]">Limited-Time Offers</p>
        <h2 id="discounts-popup-heading" className="mb-4 font-serif text-2xl text-[var(--color-text-primary)]">
          Here&apos;s what&apos;s live right now
        </h2>

        <ul className="mb-6 space-y-3">
          {discounts.map((discount) => (
            <li key={discount.id} className="flex items-start gap-2 text-sm text-[var(--color-text-secondary)]">
              <span className="text-[var(--color-accent)]" aria-hidden="true">✦</span>
              <span>
                {discount.summary}
                {discount.kind === 'code' && (
                  <>
                    {' '}— use code{' '}
                    <span className="font-semibold text-[var(--color-text-primary)]">{discount.code}</span>
                  </>
                )}
              </span>
            </li>
          ))}
        </ul>

        <Link
          to="/collections/all-products"
          onClick={() => setOpen(false)}
          className="h-btn-primary block text-center"
        >
          Shop Now
        </Link>
      </div>
    </div>
  );
}
