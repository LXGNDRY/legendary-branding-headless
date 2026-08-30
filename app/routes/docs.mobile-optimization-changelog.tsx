import {type MetaFunction, useLocation} from 'react-router';
import DocsLayout from '~/components/docs/DocsLayout';

export const meta: MetaFunction = () => {
  const canonical = 'https://legendary-branding.com/docs/mobile-optimization-changelog';
  return [
    {title: 'Mobile Optimization Pass — LEGENDARY BRANDING'},
    {name: 'description', content: 'Ten vertical slices hardening the storefront for real mobile devices — touch targets, hover-capability bugs, a site-wide viewport-meta fix, checkout handoff, accessibility, performance, and device/browser coverage.'},
    {tagName: 'link', rel: 'canonical', href: canonical},
    {property: 'og:title', content: 'Mobile Optimization Pass'},
    {property: 'og:description', content: 'Ten vertical slices hardening the storefront for real mobile devices.'},
    {property: 'og:url', content: canonical},
  ];
};

function SectionHeading({id, children}: {id: string; children: React.ReactNode}) {
  return (
    <h2
      id={id}
      className="font-serif text-3xl text-[var(--color-foreground)] mt-16 mb-6 pb-3 border-b border-[var(--color-border-subtle)] scroll-mt-24"
    >
      {children}
    </h2>
  );
}

function SubHeading({id, children}: {id: string; children: React.ReactNode}) {
  return (
    <h3
      id={id}
      className="font-serif text-xl text-[var(--color-foreground)] mt-8 mb-4 scroll-mt-24"
    >
      {children}
    </h3>
  );
}

function P({children}: {children: React.ReactNode}) {
  return <p className="text-[var(--color-foreground)]/80 leading-relaxed mb-4">{children}</p>;
}

function InlineCode({children}: {children: React.ReactNode}) {
  return (
    <code className="px-1.5 py-0.5 bg-[var(--color-surface)] text-sm text-[var(--color-accent)] rounded font-mono">
      {children}
    </code>
  );
}

function PrBadge({children}: {children: React.ReactNode}) {
  return (
    <span className="h-eyebrow text-[var(--color-accent)] ml-3 align-middle">
      {children}
    </span>
  );
}

export default function MobileOptimizationChangelogPage() {
  const location = useLocation();

  return (
    <DocsLayout currentPath={location.pathname}>
      <div>
        <p className="h-eyebrow text-[var(--color-accent)] mb-4">MOBILE OPTIMIZATION</p>
        <h1 className="font-serif text-4xl md:text-5xl font-normal text-[var(--color-foreground)] mb-4 leading-tight">
          Ten Slices, Ten PRs,
          <br />
          One Real Mobile Storefront
        </h1>
        <p className="text-lg text-[var(--color-text-secondary)] leading-relaxed mb-8 max-w-2xl">
          Each slice branched from <InlineCode>dev</InlineCode>, reviewed by
          Codex, CI-gated, and merged individually. This page is the
          release-facing summary — each PR&apos;s own description has the
          full technical detail and verification steps.
        </p>

        <SectionHeading id="why">Why this pass happened</SectionHeading>
        <P>
          A Codex review on an early PR (#66, Quick Add / Wishlist
          visibility) caught that gating hover-reveal UI on the{' '}
          <InlineCode>sm:</InlineCode> viewport breakpoint conflates screen
          width with input capability — a touch-capable tablet or landscape
          phone wider than 640px would still get treated as &ldquo;desktop&rdquo;
          and lose access to controls that have no other way to be
          discovered. That one finding reframed the whole effort: mobile bugs
          in this codebase weren&apos;t really about screen size, they were
          about wrongly assuming hover, precise pointers, and generous touch
          targets that don&apos;t exist on the devices most shoppers actually
          use.
        </P>

        <SectionHeading id="slices">What changed, slice by slice</SectionHeading>

        <SubHeading id="slice-5">
          Slice 5 — Collection / search / cards <PrBadge>PR #67</PrBadge>
        </SubHeading>
        <ul className="list-disc pl-5 mb-6 space-y-2 text-[var(--color-foreground)]/80">
          <li>
            Collection tile &ldquo;Shop →&rdquo; CTAs and the mobile filter
            trigger fixed for touch — the CTA used the same{' '}
            <InlineCode>opacity-0 group-hover</InlineCode> pattern already
            identified as broken in PR #66, and the filter button&apos;s tap
            target was under the 44px minimum.
          </li>
          <li>
            A Codex follow-up caught that{' '}
            <InlineCode>(hover: hover) and (pointer: fine)</InlineCode> alone
            still matches a <strong>hybrid device</strong> (a touchscreen
            laptop with a mouse/trackpad as its primary pointer) — fixed by
            also excluding <InlineCode>any-pointer: coarse</InlineCode>, so a
            touch user on that hardware still gets the control.
          </li>
        </ul>

        <SubHeading id="slice-6">
          Slice 6 — Cart drawer / page <PrBadge>PR #68</PrBadge>
        </SubHeading>
        <ul className="list-disc pl-5 mb-6 space-y-2 text-[var(--color-foreground)]/80">
          <li>
            Quantity steppers, remove buttons, the drawer close button, and
            the discount Apply/Cancel controls resized to the 44px
            touch-target minimum.
          </li>
          <li>
            Fixing the drawer&apos;s checkout button surfaced a{' '}
            <strong>site-wide bug</strong>: every route defines its own{' '}
            <InlineCode>meta</InlineCode> export, and React Router v7 does
            not merge a leaf route&apos;s <InlineCode>meta</InlineCode> with
            its parent&apos;s — so root&apos;s <InlineCode>viewport</InlineCode>
            /<InlineCode>color-scheme</InlineCode>/<InlineCode>theme-color</InlineCode>{' '}
            tags were silently dropped on every single page. Real mobile
            browsers were falling back to a ~980px desktop-width layout
            viewport everywhere, undermining every other mobile fix in this
            pass. Fixed by hardcoding those three tags directly in{' '}
            <InlineCode>root.tsx</InlineCode>&apos;s <InlineCode>&lt;head&gt;</InlineCode>,
            independent of any route&apos;s <InlineCode>meta</InlineCode> export.
          </li>
          <li>
            A Codex follow-up caught a real overflow: the discount
            form&apos;s Cancel button, once given padding for its touch
            target, could push past its container at narrow widths — fixed
            with <InlineCode>min-w-0</InlineCode> on the input and a wrapped
            button group.
          </li>
        </ul>

        <SubHeading id="slice-7">
          Slice 7 — Checkout handoff <PrBadge>PR #69</PrBadge>
        </SubHeading>
        <P>
          Scoped tightly to what this codebase actually controls — the
          storefront only redirects to Shopify&apos;s hosted checkout, it
          doesn&apos;t implement checkout itself.
        </P>
        <ul className="list-disc pl-5 mb-6 space-y-2 text-[var(--color-foreground)]/80">
          <li>
            Added a missing <InlineCode>checkoutUrl</InlineCode> guard to the
            drawer&apos;s checkout button (<InlineCode>cart.tsx</InlineCode>{' '}
            already had one).
          </li>
          <li>
            Added a &ldquo;Redirecting…&rdquo; loading state so a slow mobile
            connection doesn&apos;t read as an unresponsive tap.
          </li>
          <li>
            A Codex review caught a real lockout: hitting <strong>Back</strong>{' '}
            from Shopify&apos;s hosted checkout can restore the page from the
            bfcache with React state intact, leaving the button permanently
            disabled — fixed with a <InlineCode>pageshow</InlineCode>{' '}
            listener, plus an exception for modifier/middle-clicks that open
            checkout in a new tab without navigating the current one away.
          </li>
        </ul>

        <SubHeading id="slice-8">
          Slice 8 — Accessibility <PrBadge>PR #70</PrBadge>
        </SubHeading>
        <ul className="list-disc pl-5 mb-6 space-y-2 text-[var(--color-foreground)]/80">
          <li>
            The search typeahead had <strong>zero combobox semantics</strong>{' '}
            — no <InlineCode>role</InlineCode>, <InlineCode>aria-expanded</InlineCode>,{' '}
            <InlineCode>aria-activedescendant</InlineCode>, and no keyboard
            navigation at all, making it unusable for screen reader and
            keyboard-only users. Added full ARIA combobox/listbox/option
            wiring with arrow-key navigation and <InlineCode>scrollIntoView</InlineCode>.
          </li>
          <li>
            Fixed a missing accessible name on the discount code input and a
            missing alt-text fallback on the product gallery&apos;s main
            image.
          </li>
          <li>
            A Codex follow-up caught that the Escape-key handler&apos;s
            empty-results guard ran <em>before</em> the Escape branch, so a
            zero-result search couldn&apos;t be dismissed with the keyboard —
            reordered so Escape always works.
          </li>
          <li>
            <strong>Flagged, not fixed:</strong> <InlineCode>--color-text-tertiary</InlineCode>{' '}
            may be under 4.5:1 contrast on dark surfaces — needs a real
            contrast checker and a design-system decision, out of scope for
            a single slice.
          </li>
        </ul>

        <SubHeading id="slice-9">
          Slice 9 — Performance <PrBadge>PR #71</PrBadge>
        </SubHeading>
        <ul className="list-disc pl-5 mb-6 space-y-2 text-[var(--color-foreground)]/80">
          <li>
            Fixed one <InlineCode>&lt;Image&gt;</InlineCode> missing explicit{' '}
            <InlineCode>width</InlineCode>/<InlineCode>height</InlineCode> (a
            real CLS risk).
          </li>
          <li>
            The Judge.me review widget script was loading{' '}
            <strong>unconditionally on every route</strong> — home, cart,
            journal, everywhere — even though it only ever renders on
            product pages with review metafield data. Moved the loading
            logic to be gated on that data actually being present.
          </li>
          <li>
            <strong>Flagged, not fixed:</strong> render-blocking Google Fonts
            stylesheet, no <InlineCode>defer</InlineCode>/<InlineCode>Suspense</InlineCode>{' '}
            streaming anywhere in the route tree, and{' '}
            <InlineCode>@sentry/react</InlineCode> shipping in the client
            bundle even with no DSN configured. Each is a bigger, riskier
            lift than a contained slice fix.
          </li>
        </ul>

        <SubHeading id="slice-10">
          Slice 10 — Device/browser verification <PrBadge>PR #72</PrBadge>
        </SubHeading>
        <ul className="list-disc pl-5 mb-6 space-y-2 text-[var(--color-foreground)]/80">
          <li>
            The E2E matrix covered desktop Chrome, desktop Safari, and
            Android/Chrome mobile emulation, but no WebKit-engine mobile
            coverage — exactly the engine behind several of the bugs found
            in this pass. Added a <InlineCode>mobile-safari</InlineCode>{' '}
            Playwright project (<InlineCode>devices[&apos;iPhone 14&apos;]</InlineCode>{' '}
            on WebKit).
          </li>
          <li>
            A Codex review correctly caught that this project&apos;s
            original description overclaimed &ldquo;real iOS Safari&rdquo; —
            in CI it runs Playwright&apos;s Linux WebKit build with an iPhone
            viewport/UA/touch profile, not an actual iOS device or Apple&apos;s
            own Safari integration. Corrected the description; the project
            still exercises real WebKit rendering/JS-engine behavior
            Chromium&apos;s emulation can&apos;t reach, which is the actual
            value it provides.
          </li>
        </ul>

        <SubHeading id="slice-11">Slice 11 — Release regression &amp; docs (this page)</SubHeading>
        <P>Final regression sweep before closing out the pass:</P>
        <ul className="list-disc pl-5 mb-6 space-y-2 text-[var(--color-foreground)]/80">
          <li>
            <InlineCode>npm run typecheck && npm run lint && npm run build && npm run test</InlineCode>{' '}
            — all green (68/68 unit tests).
          </li>
          <li>
            Full E2E suite re-run across <InlineCode>chromium</InlineCode> and{' '}
            <InlineCode>mobile</InlineCode> locally; <InlineCode>webkit</InlineCode>{' '}
            and <InlineCode>mobile-safari</InlineCode> were confirmed green in
            CI on PR #72&apos;s merge. The only failure across every run is a
            single pre-existing, environment-specific flake in{' '}
            <InlineCode>commerce.spec.ts</InlineCode> (a live-Storefront-API
            assertion) — confirmed via <InlineCode>git stash</InlineCode> to
            reproduce identically against unmodified <InlineCode>dev</InlineCode>,
            so it predates and is unrelated to this entire pass.
          </li>
        </ul>

        <SectionHeading id="pattern">Recurring pattern worth calling out</SectionHeading>
        <P>
          Four of the ten Codex review findings across this pass (#66, #67,
          #69, #70) were the same class of mistake, restated in different
          files: assuming a narrower condition holds than actually does —
          desktop-vs-mobile instead of hover-capability, primary-pointer
          instead of any-pointer, &ldquo;the user navigated away&rdquo;
          instead of &ldquo;the page can be restored from bfcache&rdquo;,
          &ldquo;the guard should always apply&rdquo; instead of &ldquo;Escape
          is the exception&rdquo;. None of these were caught by local
          testing; all of them were caught by a second, adversarial read of
          the same diff. That&apos;s the actual argument for keeping Codex
          review in the loop on every PR, not just the complex ones.
        </P>

        <SectionHeading id="open">What&apos;s intentionally still open</SectionHeading>
        <P>Carried forward as follow-up work, not fixed in this pass:</P>
        <ul className="list-disc pl-5 mb-6 space-y-2 text-[var(--color-foreground)]/80">
          <li>
            <InlineCode>search.tsx</InlineCode> has no filter UI on any
            viewport despite the loader supporting it (flagged in PR #67).
          </li>
          <li>
            <InlineCode>--color-text-tertiary</InlineCode> contrast needs
            verification and a design-system decision (flagged in PR #70).
          </li>
          <li>
            Render-blocking Google Fonts, no route-level streaming, and
            Sentry&apos;s unconditional client bundle (all flagged in PR #71).
          </li>
        </ul>
        <P>
          Each was deliberately scoped out rather than bundled in, since each
          is a structural or design-system-level change bigger than a single
          vertical slice — exactly the kind of change that benefits from
          being reviewed and prioritized on its own, not smuggled into an
          unrelated fix.
        </P>
      </div>
    </DocsLayout>
  );
}
