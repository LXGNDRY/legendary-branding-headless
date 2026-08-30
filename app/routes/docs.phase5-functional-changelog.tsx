import {type MetaFunction, useLocation} from 'react-router';
import DocsLayout from '~/components/docs/DocsLayout';

export const meta: MetaFunction = () => {
  const canonical = 'https://legendary-branding.com/docs/phase5-functional-changelog';
  return [
    {title: 'Phase 5 — Functional Changelog — LEGENDARY BRANDING'},
    {name: 'description', content: 'Address CRUD, wishlist persistence with Customer Account metafield sync, and explicit image dimensions across all sections.'},
    {tagName: 'link', rel: 'canonical', href: canonical},
    {property: 'og:title', content: 'Phase 5 — Functional Changelog'},
    {property: 'og:description', content: 'Address CRUD, wishlist persistence, explicit image dimensions.'},
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

function SubSubHeading({id, children}: {id: string; children: React.ReactNode}) {
  return (
    <h4
      id={id}
      className="text-sm font-semibold tracking-wide uppercase text-[var(--color-foreground)] mt-6 mb-3 scroll-mt-24"
    >
      {children}
    </h4>
  );
}

function P({children}: {children: React.ReactNode}) {
  return <p className="text-[var(--color-foreground)]/80 leading-relaxed mb-4">{children}</p>;
}

function Lead({children}: {children: React.ReactNode}) {
  return (
    <p className="text-lg text-[var(--color-text-secondary)] leading-relaxed mb-8 max-w-2xl">
      {children}
    </p>
  );
}

function InlineCode({children}: {children: React.ReactNode}) {
  return (
    <code className="px-1.5 py-0.5 bg-[var(--color-surface)] text-sm text-[var(--color-accent)] rounded font-mono">
      {children}
    </code>
  );
}

function CodeBlock({children}: {children: React.ReactNode}) {
  return (
    <pre className="bg-[var(--color-foreground)] text-[var(--color-text-inverse)] p-5 rounded-lg text-sm overflow-x-auto mb-6 font-mono leading-relaxed">
      {children}
    </pre>
  );
}

function Note({children}: {children: React.ReactNode}) {
  return (
    <div className="border-l-4 border-[var(--color-accent)] bg-[var(--color-accent)]/5 p-5 rounded-r-lg mb-6">
      <p className="text-sm text-[var(--color-foreground)] leading-relaxed m-0">{children}</p>
    </div>
  );
}

function DocTable({
  headers,
  rows,
}: {
  headers: string[];
  rows: string[][];
}) {
  return (
    <div className="overflow-x-auto mb-6">
      <table className="w-full text-sm border-collapse">
        <thead>
          <tr className="border-b border-[var(--color-border-subtle)]">
            {headers.map((h) => (
              <th
                key={h}
                className="text-left h-eyebrow text-[var(--color-text-tertiary)] py-3 pr-4 font-normal first:pl-0"
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} className="border-b border-[var(--color-border-subtle)]/50">
              {row.map((cell, j) => (
                <td
                  key={j}
                  className="py-3 pr-4 text-[var(--color-foreground)]/80 first:pl-0"
                >
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function OnThisPage({items}: {items: Array<{id: string; label: string}>}) {
  return (
    <div className="bg-[var(--color-surface)] p-6 rounded-lg mb-8">
      <p className="h-eyebrow text-[var(--color-text-tertiary)] mb-3">ON THIS PAGE</p>
      <ul className="space-y-2">
        {items.map((item) => (
          <li key={item.id}>
            <a
              href={`#${item.id}`}
              className="text-sm text-[var(--color-foreground)]/70 hover:text-[var(--color-foreground)] transition-colors"
            >
              {item.label}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function Phase5ChangelogPage() {
  const location = useLocation();

  return (
    <DocsLayout currentPath={location.pathname}>
      <div>
        <p className="h-eyebrow text-[var(--color-accent)] mb-4">PHASE 5</p>
        <h1 className="font-serif text-4xl md:text-5xl font-normal text-[var(--color-foreground)] mb-4 leading-tight">
          Functional Changelog
        </h1>
        <Lead>
          Address CRUD, wishlist persistence with Customer Account metafield sync,
          and explicit image dimensions added across all sections. All three items
          land together with zero new runtime dependencies.
        </Lead>

        <OnThisPage
          items={[
            {id: 'address-crud', label: '1. Address CRUD'},
            {id: 'wishlist-persistence', label: '2. Wishlist Persistence'},
            {id: 'image-dimensions', label: '3. Explicit Image Dimensions'},
            {id: 'checks', label: '4. Checks'},
            {id: 'next-up', label: '5. Next Up'},
          ]}
        />

        <SectionHeading id="address-crud">1. Address CRUD</SectionHeading>

        <P>
          Full address management behind the Customer Account API. Previously the
          addresses page was a static UI mockup with unbound buttons. Now every
          action (create, update, delete, set-default) hits the real Customer
          Account API via server-side mutations.
        </P>

        <SubSubHeading id="address-crud-files">Files</SubSubHeading>
        <ul className="list-disc pl-5 mb-6 space-y-1 text-[var(--color-foreground)]/80">
          <li>
            <InlineCode>app/routes/account.edit.tsx</InlineCode> — new route
            (profile editing)
          </li>
          <li>
            <InlineCode>app/routes/account.addresses.tsx</InlineCode> — rewritten
            from static UI to full CRUD
          </li>
        </ul>

        <SubHeading id="account-edit-route">Account Edit Route</SubHeading>
        <P>
          Profile detail editing at <InlineCode>/account/edit</InlineCode>.
          Previously the account dashboard linked here but the route didn&apos;t
          exist — it was a dead link returning 404.
        </P>
        <P>
          <strong>Fields:</strong> first name, last name (editable); email
          (read-only display).
        </P>
        <P>
          <strong>Mutation used:</strong>{' '}
          <InlineCode>customerUpdate</InlineCode> (Customer Account API).
        </P>
        <P>
          States: success banner when save completes, per-error list when the API
          returns <InlineCode>userErrors</InlineCode>, cancel button returns to{' '}
          <InlineCode>/account</InlineCode>.
        </P>

        <CodeBlock>
{`// account.edit.tsx action
const result = await customerAccount.mutate(CUSTOMER_UPDATE_MUTATION, {
  variables: {
    customer: { firstName, lastName },
  },
});`}
        </CodeBlock>

        <SubHeading id="addresses-route">Addresses Route</SubHeading>
        <P>
          Four address mutations, all server-side. Create and update use the same
          shared <InlineCode>AddressForm</InlineCode> component inline — no modal,
          no route change. Delete and set-default use{' '}
          <InlineCode>useFetcher</InlineCode> so only the affected card
          re-renders.
        </P>

        <DocTable
          headers={['Action', 'Mutation', 'UI Trigger']}
          rows={[
            ['Create', 'customerAddressCreate', '"+ Add Address" card → inline form'],
            ['Update', 'customerAddressUpdate', '"Edit" button on each card → inline form'],
            ['Delete', 'customerAddressDelete', '"Delete" button (confirm dialog)'],
            ['Set default', 'customerDefaultAddressUpdate', '"Set as Default" (non-default cards only)'],
          ]}
        />

        <P>
          <strong>Address fields:</strong> first name, last name, company
          (optional), address1, address2 (optional), city, province, ZIP,
          country, phone (optional).
        </P>

        <P>
          <strong>Empty state:</strong> if the customer has zero addresses, a
          centered CTA card prompts to add one.
        </P>

        <SubHeading id="address-dead-links">Resolved Dead Links</SubHeading>
        <ul className="list-disc pl-5 mb-6 space-y-1 text-[var(--color-foreground)]/80">
          <li>
            <InlineCode>/account/edit</InlineCode> — now exists, was 404
          </li>
          <li>
            &quot;Edit Details&quot; button on account dashboard — now navigates
            to a working page
          </li>
          <li>
            &quot;Account&quot; quick-link in account dashboard — same
          </li>
        </ul>

        <SectionHeading id="wishlist-persistence">
          2. Wishlist Persistence
        </SectionHeading>

        <P>
          Wishlists now sync to a <InlineCode>custom.wishlist</InlineCode>{' '}
          customer metafield when the user is logged in. Guest users keep the
          existing localStorage behavior — nothing changes for them. The system
          gracefully degrades: if Customer Account API isn&apos;t configured, or
          if the metafield is missing, everything still works via localStorage.
        </P>

        <SubSubHeading id="wishlist-files">Files</SubSubHeading>
        <ul className="list-disc pl-5 mb-6 space-y-1 text-[var(--color-foreground)]/80">
          <li>
            <InlineCode>app/routes/api.wishlist.ts</InlineCode> — new server
            route (read + write)
          </li>
          <li>
            <InlineCode>app/components/ui/Wishlist.tsx</InlineCode> — rewritten
            provider with sync
          </li>
          <li>
            <InlineCode>app/root.tsx</InlineCode> — passes{' '}
            <InlineCode>isLoggedIn</InlineCode> to WishlistProvider
          </li>
        </ul>

        <SubHeading id="wishlist-architecture">Architecture</SubHeading>

        <CodeBlock>
{`Logged-in user flow:
  onMount → load from localStorage (instant)
            → fetch /api/wishlist (server)
            → merge local + server → state
  onToggle → update state → debounced 500ms POST to /api/wishlist

Guest user flow:
  onMount → load from localStorage (instant)
  onToggle → update state → save to localStorage`}
        </CodeBlock>

        <SubHeading id="wishlist-server-route">Server Route</SubHeading>
        <P>
          <InlineCode>GET /api/wishlist</InlineCode> — returns{' '}
          <InlineCode>{`{ items: WishlistItem[] }`}</InlineCode> from the{' '}
          <InlineCode>custom.wishlist</InlineCode> metafield. Returns 401 if not
          logged in.
        </P>
        <P>
          <InlineCode>POST /api/wishlist</InlineCode> — replaces the wishlist
          metafield with the posted <InlineCode>items</InlineCode> array. Returns
          401 if not logged in.
        </P>
        <P>The route caps writes at 100 items to avoid oversized metafield payloads.</P>
        <P>
          <strong>Metafield shape:</strong>{' '}
          <InlineCode>custom.wishlist</InlineCode> — type{' '}
          <InlineCode>json</InlineCode>, value is a{' '}
          <InlineCode>WishlistItem[]</InlineCode> array.
        </P>

        <SubHeading id="wishlist-merge">Merge Logic (on login)</SubHeading>
        <P>
          When a user logs in with items already in localStorage:
        </P>
        <ol className="list-decimal pl-5 mb-6 space-y-2 text-[var(--color-foreground)]/80">
          <li>Server wishlist is fetched</li>
          <li>Both lists are merged by <InlineCode>handle</InlineCode></li>
          <li>For duplicates, the item with the older <InlineCode>addedAt</InlineCode> wins</li>
          <li>Result is sorted oldest-first</li>
        </ol>
        <P>
          This way a user who adds items while logged out, then logs in,
          doesn&apos;t lose anything — items on both sides are preserved.
        </P>

        <SubHeading id="wishlist-debounce">Debounced Sync</SubHeading>
        <P>
          Writes to the server are debounced at <strong>500ms</strong> so rapid
          toggles (e.g. adding 3 items in a row) batch into a single POST.
        </P>

        <SubHeading id="wishlist-failures">Non-Critical Failures</SubHeading>
        <P>
          All network failures are silent from the user&apos;s perspective:
        </P>
        <ul className="list-disc pl-5 mb-6 space-y-1 text-[var(--color-foreground)]/80">
          <li>The localStorage copy stays authoritative</li>
          <li>The console logs the error for debugging</li>
          <li>No toast, no error banner, no broken state</li>
        </ul>

        <SubHeading id="wishlist-api">Provider API (unchanged)</SubHeading>
        <P>
          The <InlineCode>useWishlist()</InlineCode> return shape is fully
          backward-compatible:
        </P>
        <CodeBlock>
{`const {
  items, count, isInWishlist,
  add, remove, toggle, clear,
  isLoading, // new property
} = useWishlist();`}
        </CodeBlock>
        <P>
          One new property was added: <InlineCode>isLoading</InlineCode> (boolean)
          — <InlineCode>true</InlineCode> until the initial localStorage hydrate
          completes on the client.
        </P>

        <SubHeading id="wishlist-guest">Guest Behavior (unchanged)</SubHeading>
        <ul className="list-disc pl-5 mb-6 space-y-1 text-[var(--color-foreground)]/80">
          <li>localStorage key: <InlineCode>lb_wishlist</InlineCode></li>
          <li>TTL: 30 days</li>
          <li>Shape: <InlineCode>{`{ items: WishlistItem[], savedAt: number }`}</InlineCode></li>
        </ul>

        <Note>
          No env vars needed. The route uses the existing{' '}
          <InlineCode>customerAccount</InlineCode> context, which is already
          configured via the standard{' '}
          <InlineCode>PUBLIC_CUSTOMER_ACCOUNT_API_CLIENT_ID</InlineCode> +{' '}
          <InlineCode>PUBLIC_CUSTOMER_ACCOUNT_API_URL</InlineCode> pair. The{' '}
          <InlineCode>custom.wishlist</InlineCode> metafield must be defined in
          Shopify Admin → Settings → Custom data → Customers. Type: json.
        </Note>

        <SectionHeading id="image-dimensions">
          3. Explicit Image Dimensions
        </SectionHeading>

        <P>
          Every <InlineCode>{`<Image>`}</InlineCode> call site now has explicit{' '}
          <InlineCode>width</InlineCode> and <InlineCode>height</InlineCode> props
          alongside the existing <InlineCode>aspectRatio</InlineCode> prop. This
          satisfies the CLAUDE.md rule that all Image usage must have explicit
          dimensions to prevent CLS.
        </P>

        <SubHeading id="image-rationale">Rationale</SubHeading>
        <P>
          <InlineCode>aspectRatio</InlineCode> already prevents layout shift by
          reserving space, but explicit pixel dimensions give the browser more
          information for:
        </P>
        <ul className="list-disc pl-5 mb-6 space-y-1 text-[var(--color-foreground)]/80">
          <li>Choosing the right srcset size at parse time</li>
          <li>Better Lighthouse CLS scoring</li>
          <li>Consistent behavior across browsers and rendering modes</li>
          <li>Faster first-paint layout calculation</li>
        </ul>

        <SubHeading id="image-dim-table">Dimensions by Aspect Ratio</SubHeading>
        <P>
          All sizes were chosen to be high enough for 2x/3x screens at typical
          viewport sizes, but low enough not to waste bandwidth:
        </P>

        <DocTable
          headers={['Aspect Ratio', 'Width × Height', 'Used For']}
          rows={[
            ['3/4 (portrait)', '800 × 1067', 'Product cards, PDP gallery, collection grids, hero right'],
            ['4/3 (landscape)', '800 × 600', 'Lookbook images, collection index cards'],
            ['4/5 (tall)', '800 × 1000', 'Brand story section'],
            ['16/9 (wide)', '1600 × 900', 'Before/after comparison, street hero (single)'],
            ['1/1 (square)', '600 × 600 / 200 × 200', 'Drop timer product, PDP gallery thumbnails'],
            ['5/6', '250 × 300', 'Cart drawer thumbnails'],
            ['6/7', '300 × 350', 'Cart page line items'],
            ['Hero left (portrait)', '1200 × 1600', 'HeroSplit left panel'],
            ['Collection hero', '1600 × 800', 'Collection page banner'],
            ['Journal featured', '1200 × 900', 'Journal index featured article'],
            ['Journal grid', '900 × 600', 'Journal index article grid'],
            ['Journal article hero', '1600 × 700', 'Journal article header (16/7)'],
          ]}
        />

        <SubHeading id="image-components-touched">Components Touched</SubHeading>

        <SubSubHeading id="image-ui-components">UI Components</SubSubHeading>
        <ul className="list-disc pl-5 mb-4 space-y-1 text-[var(--color-foreground)]/80">
          <li>ProductCard — all 3 instances (cart variant, primary, secondary hover)</li>
          <li>ProductGallery — main image + thumbnail grid</li>
          <li>CartDrawer — line item thumbnails</li>
        </ul>

        <SubSubHeading id="image-sections">Sections</SubSubHeading>
        <ul className="list-disc pl-5 mb-4 space-y-1 text-[var(--color-foreground)]/80">
          <li>HeroSplit — left (1200×1600) + right (800×1000)</li>
          <li>CategoryGrid — all category cards</li>
          <li>CollectionGrid — all collection cards</li>
          <li>Lookbook — all lookbook images</li>
          <li>BrandStory — brand image</li>
          <li>BeforeAfter — before + after images</li>
          <li>FitCheck — main image</li>
          <li>DropTimer — product image</li>
          <li>StreetHero — left + right images</li>
        </ul>

        <SubSubHeading id="image-routes">Routes</SubSubHeading>
        <ul className="list-disc pl-5 mb-6 space-y-1 text-[var(--color-foreground)]/80">
          <li>cart.tsx — line item images</li>
          <li>collections.$handle.tsx — collection hero</li>
          <li>collections._index.tsx — collection grid</li>
          <li>journal._index.tsx — featured + grid</li>
          <li>journal.$articleHandle.tsx — article hero</li>
        </ul>

        <Note>
          The <InlineCode>aspectRatio</InlineCode> prop is preserved on every
          call site — explicit dimensions are additive, not a replacement.
          Images continue to fill their container via{' '}
          <InlineCode>w-full h-full object-cover</InlineCode> as before.
        </Note>

        <SectionHeading id="checks">4. Checks</SectionHeading>
        <ul className="list-disc pl-5 mb-6 space-y-1 text-[var(--color-foreground)]/80">
          <li>Typecheck passes (<InlineCode>npm run typecheck</InlineCode>)</li>
          <li>Lint passes (<InlineCode>npm run lint</InlineCode>)</li>
          <li>No new runtime dependencies</li>
          <li>Guest user wishlist behavior is byte-identical before/after</li>
          <li>All Customer Account API calls are server-only (no tokens in client bundle)</li>
        </ul>

        <SectionHeading id="next-up">5. Next Up</SectionHeading>
        <P>
          <strong>Phase 6 — Codegen</strong> (lower priority): Generate real
          Storefront + Customer Account API TypeScript types via{' '}
          <InlineCode>npm run codegen</InlineCode>, replacing the current stub{' '}
          <InlineCode>.d.ts</InlineCode> files. DX improvement only — no
          user-visible change.
        </P>
      </div>
    </DocsLayout>
  );
}
