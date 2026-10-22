# Section registry (R21)

Single list of homepage/content sections under `app/components/sections/`. "Active" = imported by a route today.

| Section | Status | Used by |
|---|---|---|
| HeroSplit, StatStrip, CategoryGrid, NewArrivalsGrid, EditorialBand, VerifiedReviews, ReviewQuotes, NewsletterBand, BrandMarquee, CurrentOffers | Active | `routes/_index.tsx` |
| ContentBlocks | Active | `routes/pages.$handle.tsx` |
| ProductReviewList | Active | `routes/products.$handle.tsx` |
| BeforeAfter, BrandStory, CollectionGrid, DropTimer, FitCheck, Lookbook, StreetHero | Dormant | none — safe to reuse; owner decides keep or delete |

Rules
- Content is visible without JS: `useReveal` / `useRevealChildren` only hide below-the-fold elements after hydration, when `IntersectionObserver` exists and reduced motion is off.
- Dormant sections must be wired to real Storefront/metaobject data and owner-approved imagery before activation; no fabricated claims (drop cadence, specs) or generated assets.
- Theme is the dark Onyx token set in `app/styles/app.css`; `app/lib/contrast.test.ts` computes AA contrast for the token pairs components render.
- Still owed: owner-approved campaign imagery (R21 assets), `color-contrast` enabled in `e2e/a11y.spec.ts` after a preview run against live data, and screenshots/CLS measurement on the preview.
