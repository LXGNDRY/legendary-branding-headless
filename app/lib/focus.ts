/**
 * Callback ref that focuses its element once, when it mounts. Used where the user has just asked for a field
 * (the discount-code toggle, the search page) instead of the `autoFocus` attribute, which fires on every
 * render pass and is flagged by accessibility linting. Keep the reference stable (module-level, as here) so
 * a re-render does not steal focus again.
 */
export function focusOnMount(element: HTMLElement | null) {
  element?.focus();
}
