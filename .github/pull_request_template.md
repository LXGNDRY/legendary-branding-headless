## Vertical slice

<!-- Name the single customer or operational capability delivered by this PR. -->

## Problem

<!-- Describe the verified problem. Link evidence; do not rely on assumptions. -->

## Implementation

<!-- Summarize material code, configuration, test, and documentation changes. -->

## Risk and rollback

- Risk level: <!-- low / medium / high -->
- Rollback: <!-- exact revert or recovery procedure -->

## Verification

- [ ] `npm ci`
- [ ] `npm run codegen`
- [ ] `npm run typecheck`
- [ ] `npm run lint`
- [ ] `npm run test`
- [ ] `npm run build`
- [ ] Applicable Playwright projects passed
- [ ] `git diff --check`
- [ ] No unexplained generated-file drift

## Commerce and customer safety

- [ ] Checkout/cart behavior is unchanged or explicitly tested
- [ ] Customer-specific responses are not publicly cached
- [ ] No secrets or sensitive customer data are exposed
- [ ] Public claims are backed by Shopify configuration or owner-approved evidence

## Release governance

- [ ] Base branch is `dev`
- [ ] The branch contains one coherent vertical slice
- [ ] Documentation reflects verified behavior
- [ ] Owner approval is still required after CI passes
