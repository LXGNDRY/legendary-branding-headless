# Public URLs, policy pages and SEO contract

Code: `app/lib/site.ts` (origin, routes, policy handles, URL helpers), `app/routes/policies.$handle.tsx`, `app/routes/pages.$handle.tsx`,
`app/routes/[sitemap.xml].tsx`, `app/routes/[robots.txt].ts`, `app/components/seo/SeoSchema.tsx`.

## One origin

- `SITE_ORIGIN` (`https://www.legendary-branding.com`) drives every canonical link, `og:url`, JSON-LD id/url, the sitemap `<loc>` values
  and the robots.txt Sitemap line. Nothing else in app source spells the domain (a test enforces it).
- It is a constant, not an env var: canonicals are built in route `meta` functions with no access to the environment, and a mistyped
  variable would silently move every canonical off the live domain. `PUBLIC_CHECKOUT_DOMAIN` is only where checkout lives.
- `absoluteUrl()` / `canonicalUrl()` return the origin for anything malformed (protocol-relative, `javascript:`, spaces, credentials,
  non-https) and strip query, fragment and trailing slash.
- Previews and the raw Oxygen URL (`*.myshopify.dev`): canonicals still point at the live origin; robots.txt disallows everything and
  every response carries `X-Robots-Tag: noindex, nofollow`.

## Policy and page ownership

- `/policies/:handle` is the one canonical home for the handles in `POLICY_PAGES`
  (refund-policy, terms-of-service, privacy-with-legendary-branding, shipping-policy, size-guide, about, contact, legendary_branding_faqs).
- **Content authority:** for the four legal handles, Shopify's built-in store policy (Settings > Policies) wins when it has a body; a
  Page of the same handle is used only when there is no built-in policy. Handles with no built-in policy take their content from the Page.
  **Owner decision:** this changes today's behavior (a custom Page used to override the built-in policy). If the store relies on such a
  Page, either move its text into Settings > Policies or tell me to flip the rule (one line in the loader).
- A required page with no content answers **503** (temporary, keeps indexing), not a 200 placeholder. `contact` renders its own block and is exempt.
- `/pages/<policy handle>` redirects 301 to `/policies/<handle>`. `/policies/<other handle>` redirects 301 to `/pages/<handle>` when such a page
  exists, else 404. Shopify Admin URL redirects are untouched.
- The sitemap lists a policy URL only when it serves content (built-in policy or a Page of that handle; contact always), each URL once.

## Structured data and images

- Organization logo: the store's brand logo, else `/icon-512.png` (a real file, checked by a test); never `favicon.ico`.
- Image transforms use the URL API (`withImageTransform`): a `?` is added or `&` appended correctly and existing width/height are replaced.
- Article `<lastmod>` is omitted (the Storefront API exposes only the publish date); products have none (inventory bumps `updatedAt`).
- Product return policy (JSON-LD) names only the active market's country (the policy text states no regions) and is omitted when unknown;
  it is never defaulted to US.

## Not done / merchant-managed values

Contact email, social profiles, blog handle and menu handles are named constants in `site.ts` / route files rather than a
metafield-backed configuration; moving them is a content-ownership decision for the owner.
