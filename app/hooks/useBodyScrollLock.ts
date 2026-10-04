import {useEffect} from 'react';

let lockCount = 0;
let originalOverflow: string | null = null;

/**
 * Locks body scroll while `active` is true, shared across every overlay
 * (cart drawer, mobile menu, size guide modal, discounts popup) via a
 * module-level reference count.
 *
 * Each of those overlays used to independently save/restore
 * `document.body.style.overflow` on its own -- harmless when only one is
 * ever open at a time, but two openable concurrently (e.g. the discounts
 * popup opening while an in-flight add-to-cart request then opens the cart
 * drawer) meant whichever one unmounted first would restore the raw
 * pre-lock value and unlock scroll while the other overlay was still open.
 * Counting locks instead of toggling a shared string fixes that: the style
 * is only ever touched on the 0 -> 1 and 1 -> 0 transitions.
 */
export function useBodyScrollLock(active: boolean) {
  useEffect(() => {
    if (!active) return;
    if (lockCount === 0) {
      originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
    }
    lockCount += 1;
    return () => {
      lockCount -= 1;
      if (lockCount === 0) {
        document.body.style.overflow = originalOverflow ?? '';
        originalOverflow = null;
      }
    };
  }, [active]);
}

/** Whether any overlay currently holds the body-scroll lock. */
export function isBodyScrollLocked(): boolean {
  return lockCount > 0;
}
