# Mobile Optimization Pass — Changelog

Seven vertical slices (numbered 5–11 in the original 11-slice plan; slices
1–4 were foundational work completed earlier and aren't covered here), seven
PRs (#67–#73), each branched from `dev`, reviewed by Codex, CI-gated, and
merged individually. This document is the release-facing summary; each PR's
own description has the full technical detail and verification steps.

## Why this pass happened

A Codex review on an early PR (#66, Quick Add / Wishlist visibility) caught
that gating hover-reveal UI on the `sm:` viewport breakpoint conflates screen
width with input capability — a touch-capable tablet or landscape phone wider
than 640px would still get treated as "desktop" and lose access to controls
that have no other way to be discovered. That one finding reframed the whole
effort: mobile bugs in this codebase weren't really about screen size, they
were about wrongly assuming hover, precise pointers, and generous touch
targets that don't exist on the devices most shoppers actually use.

## What changed, slice by slice

### Slice 5 — Collection / search / cards (PR #67)
- Collection tile "Shop →" CTAs and the mobile filter trigger were fixed for
  touch — the CTA used the same `opacity-0 group-hover` pattern already
  identified as broken in PR #66, and the filter button's tap target was
  under the 44px minimum.
- A Codex follow-up caught that `(hover: hover) and (pointer: fine)` alone
  still matches a **hybrid device** (a touchscreen laptop with a mouse/
  trackpad as its primary pointer) — fixed by also excluding
  `any-pointer: coarse`, so a touch user on that hardware still gets the
  control.

### Slice 6 — Cart drawer / page (PR #68)
- Quantity steppers, remove buttons, the drawer close button, and the
  discount Apply/Cancel controls were all resized to the 44px touch-target
  minimum.
- Fixing the drawer's checkout button surfaced a **site-wide bug**: every
  route defines its own `meta` export, and React Router v7 does not merge a
  leaf route's `meta` with its parent's — so root's `viewport` /
  `color-scheme` / `theme-color` tags were silently dropped on every single
  page. Real mobile browsers were falling back to a ~980px desktop-width
  layout viewport everywhere, undermining every other mobile fix in this
  pass. Fixed by hardcoding those three tags directly in `root.tsx`'s
  `<head>`, independent of any route's `meta` export.
- A Codex follow-up caught a real overflow: the discount form's Cancel
  button, once given padding for its touch target, could push past its
  container at narrow widths — fixed with `min-w-0` on the input and a
  wrapped button group.

### Slice 7 — Checkout handoff (PR #69)
Scoped tightly to what this codebase actually controls — the storefront only
redirects to Shopify's hosted checkout, it doesn't implement checkout itself.
- Added a missing `checkoutUrl` guard to the drawer's checkout button
  (`cart.tsx` already had one).
- Added a "Redirecting…" loading state so a slow mobile connection doesn't
  read as an unresponsive tap.
- A Codex review caught a real lockout: hitting **Back** from Shopify's
  hosted checkout can restore the page from the bfcache with React state
  intact, leaving the button permanently disabled — fixed with a `pageshow`
  listener, plus an exception for modifier/middle-clicks that open checkout
  in a new tab without navigating the current one away.

### Slice 8 — Accessibility (PR #70)
- The search typeahead had **zero combobox semantics** — no `role`,
  `aria-expanded`, `aria-activedescendant`, and no keyboard navigation at
  all, making it unusable for screen reader and keyboard-only users. Added
  full ARIA combobox/listbox/option wiring with arrow-key navigation and
  `scrollIntoView`.
- Fixed a missing accessible name on the discount code input and a missing
  alt-text fallback on the product gallery's main image.
- A Codex follow-up caught that the Escape-key handler's empty-results guard
  ran *before* the Escape branch, so a zero-result search couldn't be
  dismissed with the keyboard — reordered so Escape always works.
- Flagged, not fixed: `--color-text-tertiary` may be under 4.5:1 contrast on
  dark surfaces — needs a real contrast checker and a design-system
  decision, out of scope for a single slice.

### Slice 9 — Performance (PR #71)
- Fixed one `<Image>` missing explicit `width`/`height` (a real CLS risk).
- The Judge.me review widget script was loading **unconditionally on every
  route** — home, cart, journal, everywhere — even though it only ever
  renders on product pages with review metafield data. Moved the loading
  logic to be gated on that data actually being present.
- Flagged, not fixed: render-blocking Google Fonts stylesheet, no
  `defer`/`Suspense` streaming anywhere in the route tree, and `@sentry/react`
  shipping in the client bundle even with no DSN configured. Each is a
  bigger, riskier lift than a contained slice fix.

### Slice 10 — Device/browser verification (PR #72)
- The E2E matrix covered desktop Chrome, desktop Safari, and Android/Chrome
  mobile emulation, but no WebKit-engine mobile coverage — exactly the
  engine behind several of the bugs found in this pass. Added a
  `mobile-safari` Playwright project (`devices['iPhone 14']` on WebKit).
- A Codex review correctly caught that this project's original description
  overclaimed "real iOS Safari" — in CI it runs Playwright's Linux WebKit
  build with an iPhone viewport/UA/touch profile, not an actual iOS device
  or Apple's own Safari integration. Corrected the description; the project
  still exercises real WebKit rendering/JS-engine behavior Chromium's
  emulation can't reach, which is the actual value it provides.

### Slice 11 — Release regression & docs (this document)
Final regression sweep before closing out the pass:
- `npm run typecheck && npm run lint && npm run build && npm run test` — all
  green (68/68 unit tests).
- Full E2E suite re-run across `chromium` and `mobile` locally; `webkit` and
  `mobile-safari` were confirmed green in CI on PR #72's merge. The only
  failure across every run is a single pre-existing, environment-specific
  flake in `commerce.spec.ts` (a live-Storefront-API assertion) — confirmed
  via `git stash` to reproduce identically against unmodified `dev`, so it
  predates and is unrelated to this entire pass.

## Recurring pattern worth calling out

Four of the ten Codex review findings across this pass (#66, #67, #69, #70)
were the same class of mistake, restated in different files: assuming a
narrower condition holds than actually does — desktop-vs-mobile instead of
hover-capability, primary-pointer instead of any-pointer, "the user
navigated away" instead of "the page can be restored from bfcache",
"the guard should always apply" instead of "Escape is the exception". None of
these were caught by local testing; all of them were caught by a second,
adversarial read of the same diff. That's the actual argument for keeping
Codex review in the loop on every PR, not just the complex ones.

## What's intentionally still open

Carried forward as follow-up work, not fixed in this pass:
- `search.tsx` has no filter UI on any viewport despite the loader
  supporting it (flagged in PR #67).
- `--color-text-tertiary` contrast needs verification and a design-system
  decision (flagged in PR #70).
- Render-blocking Google Fonts, no route-level streaming, and Sentry's
  unconditional client bundle (all flagged in PR #71).

Each was deliberately scoped out rather than bundled in, since each is a
structural or design-system-level change bigger than a single vertical
slice — exactly the kind of change that benefits from being reviewed and
prioritized on its own, not smuggled into an unrelated fix.
