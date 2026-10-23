# Accessibility contract: controls and overlays

## Controls

- **One interactive element per action.** A link is `<Button as="link">` / `<Button as="a">`, never a button inside a link
  (axe `nested-interactive`; tests assert no `a button` / `button a` in the account pages, drawer and pagination).
- **Disabled means disabled.** A disabled or loading link/anchor variant renders as a disabled `<button>`: an `<a>` cannot be
  disabled, and `aria-disabled` alone still follows on click and on Enter. Checkout uses this: a plain click starts the redirect and
  the control becomes non-activatable; a modified or middle click opens a new tab and leaves it usable.
- **Labels and fields.** Every form field has an associated label (`htmlFor`/`id`) and the right `autocomplete` token. Mutation
  results are announced: errors `role="alert"`, success `role="status"`, load failures `role="alert"` with a retry link.
- **Headings** do not skip levels (the account dashboard and order cards were h1 then h3).
- **Duplicate links** (a product image beside its title link) hide the image link from keyboard and assistive tech.
- **Focus on request, not on load.** The `autoFocus` attribute is replaced by focusing on mount (`focusOnMount` / an effect) where the
  user just asked for the field.

## Overlays (`app/lib/overlay-stack.ts`, `app/hooks/useFocusTrap.ts`)

- Cart drawer, mobile menu, quick add, size guide, discounts popup and the filter drawers share one stack.
- Only the **topmost** overlay traps Tab and answers Escape, so one Escape closes one overlay.
- While an overlay is open, everything outside its own branch of the document is `inert` (not focusable, not clickable, hidden from
  assistive technology). Closing the top overlay hands this to the one beneath; closing the last restores the page. Elements that
  were already inert are never touched.
- Scrims that close their overlay on click, and live regions, carry `data-overlay-keep` so they stay interactive.
- Closing returns focus to the control that opened it (if it is still in the page). The trap does not restart when its owner re-renders
  (typing, cart revalidation), and its focus timer is cancelled on cleanup.
- Body scroll is locked by a shared counter (`useBodyScrollLock`).

## Tests and linting

- jsdom + axe (`app/__tests__/a11y.test.tsx`): Button states, account dashboard/orders/edit/addresses (filled, empty, failed, paginated),
  filled cart drawer, cookie banner and its category panel, size guide. `color-contrast` cannot run in jsdom.
- Keyboard/overlay behavior (`app/hooks/overlay.test.tsx`): inert background, topmost-only Escape, focus restoration, typing keeps focus.
- Real browser (`e2e/a11y.spec.ts`): cart page axe, cookie preferences dialog axe, cart drawer focus/inert/Escape/restore.
  Contrast is excluded there until the theme reconciliation (R21).
- Lint: `label-has-associated-control`, `click-events-have-key-events`, `no-static-element-interactions`, `role-has-required-aria-props`,
  `no-autofocus` are errors. `prefer-tag-over-role` is off: the overlays are managed `role="dialog"` containers with a focus trap, not
  native `<dialog>` elements. React-compiler rules stay warnings until R21.

## Not verified

Real mobile Safari, touch, and reduced-motion behavior of the overlays; screen-reader walkthroughs; computed contrast (R21). Do these on a deployed preview.
