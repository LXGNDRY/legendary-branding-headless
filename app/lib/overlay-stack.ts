/**
 * Overlay stack: which modal overlay (cart drawer, menu, quick add, popups, size guide, filter drawer) is on
 * top, and which parts of the page are inert while it is.
 *
 * - Only the topmost overlay traps focus and answers Escape, so nested or stacked overlays never fight.
 * - Everything outside the topmost overlay's own branch of the document is made `inert` (not focusable, not
 *   clickable, hidden from assistive technology). Closing the top overlay hands that to the one beneath it, and
 *   closing the last one restores the page exactly as it was.
 * - An element marked `data-overlay-keep` stays interactive: scrims that close their overlay on click, and
 *   live regions that must keep announcing.
 */

export type OverlayHandle = {readonly container: HTMLElement; readonly zIndex: number};

const stack: OverlayHandle[] = [];
// The elements this module made inert, so elements that were already inert are never touched.
const inerted = new Set<Element>();

const NEVER_INERT = new Set(['SCRIPT', 'STYLE', 'LINK', 'META', 'TEMPLATE', 'NOSCRIPT']);

function restoreInert() {
  for (const element of inerted) element.removeAttribute('inert');
  inerted.clear();
}

function applyInert() {
  restoreInert();
  const top = stack[stack.length - 1];
  if (!top || typeof document === 'undefined') return;
  let node: HTMLElement | null = top.container;
  while (node && node !== document.documentElement) {
    const parent: HTMLElement | null = node.parentElement;
    if (!parent) break;
    for (const sibling of Array.from(parent.children)) {
      if (sibling === node || NEVER_INERT.has(sibling.tagName)) continue;
      if (sibling.hasAttribute('inert') || sibling.hasAttribute('data-overlay-keep')) continue;
      sibling.setAttribute('inert', '');
      inerted.add(sibling);
    }
    node = parent;
  }
}

/** The stacking level the overlay is drawn at: the z-index of its nearest positioned ancestor (itself included). */
function stackingLevel(container: HTMLElement): number {
  for (let node: HTMLElement | null = container; node && node !== document.documentElement; node = node.parentElement) {
    const style = getComputedStyle(node);
    const z = Number.parseInt(style.zIndex, 10);
    if (Number.isFinite(z) && style.position !== 'static') return z;
  }
  return 0;
}

/**
 * Puts an overlay in the stack and returns the function that removes it. The stack is ordered by what is drawn on
 * top, not by who opened last: an overlay that opens beneath a higher one (the cart opening under the discounts
 * popup after an add-to-cart finishes) does not take the keyboard or the inert page away from the visible one.
 * Overlays at the same level are ordered by when they opened.
 */
export function registerOverlay(container: HTMLElement): {handle: OverlayHandle; release: () => void} {
  const handle: OverlayHandle = {container, zIndex: stackingLevel(container)};
  let at = stack.length;
  while (at > 0 && stack[at - 1].zIndex > handle.zIndex) at -= 1;
  stack.splice(at, 0, handle);
  applyInert();
  return {
    handle,
    release: () => {
      const index = stack.indexOf(handle);
      if (index === -1) return;
      stack.splice(index, 1);
      applyInert();
    },
  };
}

export function isTopmostOverlay(handle: OverlayHandle | null): boolean {
  return handle !== null && stack[stack.length - 1] === handle;
}

export function overlayDepth(): number {
  return stack.length;
}

/** Test hook. */
export function resetOverlayStack() {
  stack.length = 0;
  restoreInert();
}
