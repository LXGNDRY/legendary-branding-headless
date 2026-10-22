/**
 * Overlay stack: which modal overlay (cart drawer, menu, quick add, popups, chat, size guide, filter drawer) is on
 * top, and which parts of the page are inert while it is.
 *
 * - Only the topmost overlay traps focus and answers Escape, so nested or stacked overlays never fight.
 * - Everything outside the topmost overlay's own branch of the document is made `inert` (not focusable, not
 *   clickable, hidden from assistive technology). Closing the top overlay hands that to the one beneath it, and
 *   closing the last one restores the page exactly as it was.
 * - An element marked `data-overlay-keep` stays interactive: scrims that close their overlay on click, and
 *   live regions that must keep announcing.
 */

export type OverlayHandle = {readonly container: HTMLElement};

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

/** Puts an overlay on top of the stack. Returns the function that removes it. */
export function registerOverlay(container: HTMLElement): {handle: OverlayHandle; release: () => void} {
  const handle: OverlayHandle = {container};
  stack.push(handle);
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
