import {type MetaFunction, useLocation} from 'react-router';
import DocsLayout from '~/components/docs/DocsLayout';

export const meta: MetaFunction = () => {
  const canonical = 'https://legendary-branding.com/docs/phase7-10-hardening-changelog';
  return [
    {title: 'Phases 7–10 — Performance, Errors, Caching & Security — LEGENDARY BRANDING'},
    {name: 'description', content: 'Combined hardening pass across 4 phases — speed, reliability, caching, and defense-in-depth.'},
    {tagName: 'link', rel: 'canonical', href: canonical},
    {property: 'og:title', content: 'Phases 7–10 — Performance & Hardening'},
    {property: 'og:description', content: 'Performance, error handling, caching, and security hardening.'},
    {property: 'og:url', content: canonical},
  ];
};

function SectionHeading({id, children}: {id: string; children: React.ReactNode}) {
  return (
    <h2
      id={id}
      className="font-serif text-3xl text-[#1A1A1A] mt-16 mb-6 pb-3 border-b border-[#E8E6E1] scroll-mt-24"
    >
      {children}
    </h2>
  );
}

function SubHeading({id, children}: {id: string; children: React.ReactNode}) {
  return (
    <h3
      id={id}
      className="font-serif text-xl text-[#1A1A1A] mt-8 mb-4 scroll-mt-24"
    >
      {children}
    </h3>
  );
}

function P({children}: {children: React.ReactNode}) {
  return <p className="text-[#1A1A1A]/80 leading-relaxed mb-4">{children}</p>;
}

function InlineCode({children}: {children: React.ReactNode}) {
  return (
    <code className="px-1.5 py-0.5 bg-[#F3F2EE] text-sm text-[#FF3B30] rounded font-mono">
      {children}
    </code>
  );
}

function DocTable({headers, rows}: {headers: string[]; rows: string[][]}) {
  return (
    <div className="overflow-x-auto mb-6">
      <table className="w-full text-sm border-collapse">
        <thead>
          <tr className="border-b border-[#E8E6E1]">
            {headers.map((h) => (
              <th key={h} className="text-left h-eyebrow text-[#9E9C97] py-3 pr-4 font-normal first:pl-0">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} className="border-b border-[#E8E6E1]/50">
              {row.map((cell, j) => (
                <td key={j} className="py-3 pr-4 text-[#1A1A1A]/80 first:pl-0">{cell}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function Phase7to10Page() {
  const location = useLocation();

  return (
    <DocsLayout currentPath={location.pathname}>
      <div>
        <p className="h-eyebrow text-[#FF3B30] mb-4">PHASES 7–10</p>
        <h1 className="font-serif text-4xl md:text-5xl font-normal text-[#1A1A1A] mb-4 leading-tight">
          Performance, Errors,
          <br />
          Caching &amp; Security
        </h1>
        <p className="text-lg text-[#6B6B6B] leading-relaxed mb-8 max-w-2xl">
          Combined hardening pass across 4 phases — speed, reliability, caching,
          and defense-in-depth. All additive, zero risky refactors.
        </p>

        <SectionHeading id="phase7">Phase 7 — Performance</SectionHeading>
        <P>
          Improve Core Web Vitals (LCP, CLS, INP) and reduce perceived load time.
        </P>

        <SubHeading id="p7-preconnect">Preconnect + DNS prefetch</SubHeading>
        <ul className="list-disc pl-5 mb-6 space-y-1 text-[#1A1A1A]/80">
          <li>
            <InlineCode>preconnect</InlineCode> to <InlineCode>cdn.shopify.com</InlineCode> with{' '}
            <InlineCode>crossorigin</InlineCode> — eliminates DNS + TLS round-trip for product images
          </li>
          <li>
            <InlineCode>dns-prefetch</InlineCode> to <InlineCode>shop.app</InlineCode> — lightweight
            hint for Shopify Pay and related third-party resources
          </li>
        </ul>

        <SubHeading id="p7-fetchpriority">Hero image fetch priority</SubHeading>
        <P>
          Added <InlineCode>fetchPriority=&quot;high&quot;</InlineCode> and{' '}
          <InlineCode>decoding=&quot;sync&quot;</InlineCode> to the primary hero image
          in StreetHero — tells the browser to prioritize it for LCP. Second hero
          image keeps default priority.
        </P>

        <SubHeading id="p7-lazy">Image lazy loading (already in place)</SubHeading>
        <ul className="list-disc pl-5 mb-6 space-y-1 text-[#1A1A1A]/80">
          <li>ProductCard defaults to <InlineCode>loading=&quot;lazy&quot;</InlineCode></li>
          <li>
            All images have explicit <InlineCode>width</InlineCode>/<InlineCode>height</InlineCode>
            {' '}(Phase 5) — zero CLS from images
          </li>
        </ul>

        <SectionHeading id="phase8">Phase 8 — Error Handling</SectionHeading>
        <P>
          Graceful failure with proper error boundaries, 404s, and monitoring.
        </P>

        <SubHeading id="p8-root">Root ErrorBoundary upgrade</SubHeading>
        <ul className="list-disc pl-5 mb-6 space-y-1 text-[#1A1A1A]/80">
          <li>
            Distinguishes 404 responses from 500 errors — &quot;Lost.&quot; vs &quot;Oops.&quot;
          </li>
          <li>Adds secondary &quot;Shop All&quot; CTA to error pages</li>
          <li>Sentry capture remains intact (client + server)</li>
        </ul>

        <SubHeading id="p8-404">404 page redesign</SubHeading>
        <ul className="list-disc pl-5 mb-6 space-y-1 text-[#1A1A1A]/80">
          <li>Upgraded to Hanssen design system (serif display, eyebrow labels)</li>
          <li>
            Added <InlineCode>noindex, follow</InlineCode> robots meta tag — prevents 404s
            from indexing
          </li>
          <li>Brand voice: &quot;Lost in the drop.&quot;</li>
        </ul>

        <SubHeading id="p8-pdp">PDP ErrorBoundary</SubHeading>
        <P>
          Route-level error boundary for product pages — a bad product handle now
          shows a branded &quot;Sold out.&quot; page instead of the generic root error.
          Displays the handle in the copy and provides both &quot;Browse All Products&quot;
          and &quot;Back to Home&quot; CTAs.
        </P>

        <SectionHeading id="phase9">Phase 9 — Caching</SectionHeading>
        <P>
          Verify and document a consistent caching strategy across the storefront.
          The strategy was set up earlier in <InlineCode>app/lib/cache.ts</InlineCode>.
        </P>

        <DocTable
          headers={['Tier', 'TTL', 'SWR', 'SIE', 'Use for']}
          rows={[
            ['CacheLong', '1 hour', '24 hours', '7 days', 'Products, collections, blog, policies'],
            ['CacheShort', '1 minute', '15 minutes', '1 hour', 'Homepage, listings, search'],
            ['CacheNone', '0', '0', '0', 'Cart, account, personalized'],
          ]}
        />

        <P>All public content routes use appropriate caching:</P>
        <ul className="list-disc pl-5 mb-6 space-y-1 text-[#1A1A1A]/80">
          <li>Homepage: CacheLong</li>
          <li>Product pages: CacheLong</li>
          <li>Collection pages: CacheLong</li>
          <li>Search: CacheShort</li>
          <li>Blog/journal: CacheLong</li>
          <li>Policies/pages: CacheLong</li>
          <li>Cart/Account: uncached (per-request)</li>
        </ul>

        <SectionHeading id="phase10">Phase 10 — Security Hardening</SectionHeading>
        <P>
          Defense-in-depth at the application layer.
        </P>

        <SubHeading id="p10-ratelimit">Rate limiting utility</SubHeading>
        <ul className="list-disc pl-5 mb-6 space-y-1 text-[#1A1A1A]/80">
          <li>Sliding-window in-memory rate limiter</li>
          <li>IP-based keying with user-agent fallback</li>
          <li>Automatic cleanup of expired entries (60s sweep)</li>
          <li>
            Returns 429 with <InlineCode>Retry-After</InlineCode> header
          </li>
          <li>
            Exposes <InlineCode>X-RateLimit-Limit</InlineCode> /{' '}
            <InlineCode>X-RateLimit-Remaining</InlineCode> headers
          </li>
        </ul>

        <SubHeading id="p10-routes">Protected routes</SubHeading>
        <DocTable
          headers={['Route', 'Limit', 'Reason']}
          rows={[
            ['/api/newsletter', '5 / min / IP', 'Prevents spam-bot flood'],
            ['/api/wishlist', '30 / min / IP', 'Wishlist sync is frequent but bounded'],
            ['/api/search', '60 / min / IP', 'Prevents API credit abuse'],
          ]}
        />

        <SubHeading id="p10-newsletter">Newsletter API — sanitization</SubHeading>
        <ul className="list-disc pl-5 mb-6 space-y-1 text-[#1A1A1A]/80">
          <li>Email validation via RFC 5322 simplified regex</li>
          <li>String sanitization: strips control characters, caps length</li>
          <li>Source field capped at 50 characters</li>
        </ul>

        <SubHeading id="p10-layers">Defense-in-depth layers</SubHeading>
        <DocTable
          headers={['Layer', 'Phase', 'Status']}
          rows={[
            ['CSP headers', '2', '✓ in place'],
            ['X-Frame-Options', '2', '✓ in place'],
            ['CSRF for mutations', 'built-in', '✓ Hydrogen CartForm'],
            ['Rate limiting (app layer)', '10', '✓ new'],
            ['Input sanitization', '10', '✓ new'],
            ['Sentry error reporting', '1', '✓ in place'],
          ]}
        />

        <P>
          <strong>Note:</strong> the rate limiter is in-memory, so it works
          per-worker-instance. For production across multiple Oxygen workers,
          each worker tracks independently — the effective limit is higher than
          stated but still bounded. A shared KV-backed rate limiter can replace
          this for tighter enforcement (documented as future work).
        </P>

        <SectionHeading id="significance">Significance</SectionHeading>
        <P>
          Phases 7–10 complete the storefront&apos;s production hardening. After
          Phase 6 closed the code-validation loop, these four phases close the
          runtime loop: pages load faster, fail gracefully, stay fast under load
          via caching, and resist abuse. The storefront is now at production-grade
          readiness across all dimensions of the enterprise audit.
        </P>
      </div>
    </DocsLayout>
  );
}