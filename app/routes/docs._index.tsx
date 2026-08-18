import {type MetaFunction, Link, useLocation} from 'react-router';
import DocsLayout from '~/components/docs/DocsLayout';

export const meta: MetaFunction = () => {
  const canonical = 'https://legendary-branding.com/docs';
  return [
    {title: 'Docs — LEGENDARY BRANDING'},
    {name: 'description', content: 'Theme documentation, design system reference, and changelogs for the Legendary Branding headless storefront.'},
    {tagName: 'link', rel: 'canonical', href: canonical},
    {property: 'og:title', content: 'Docs — LEGENDARY BRANDING'},
    {property: 'og:description', content: 'Theme documentation, design system reference, and changelogs.'},
    {property: 'og:url', content: canonical},
  ];
};

const PHASE_5_ITEMS = [
  {
    title: 'Address CRUD',
    description: 'Full address management behind the Customer Account API — create, update, delete, and set-default, all server-side.',
    href: '/docs/phase5-functional-changelog#1-address-crud',
  },
  {
    title: 'Wishlist Persistence',
    description: 'Wishlists now sync to a custom.wishlist customer metafield when logged in, with localStorage fallback for guests.',
    href: '/docs/phase5-functional-changelog#2-wishlist-persistence',
  },
  {
    title: 'Explicit Image Dimensions',
    description: 'Every Image call site now has explicit width + height props alongside aspectRatio for zero CLS.',
    href: '/docs/phase5-functional-changelog#3-explicit-image-dimensions',
  },
];

const DESIGN_SYSTEM_ITEMS = [
  {
    title: 'Hanssen Design System',
    description: 'Editorial luxury streetwear — off-white canvas, serif headlines, accent red CTAs, Inter body.',
    href: '/docs/hanssen-design-system',
  },
];

function CardList({items}: {items: Array<{title: string; description: string; href: string}>}) {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      {items.map((item) => (
        <Link
          key={item.href}
          to={item.href}
          className="block p-6 border border-[#E8E6E1] rounded-lg bg-white hover:border-[#1A1A1A] transition-colors"
        >
          <h3 className="font-serif text-lg text-[#1A1A1A] mb-2">
            {item.title}
          </h3>
          <p className="text-sm text-[#6B6B6B] leading-relaxed">
            {item.description}
          </p>
        </Link>
      ))}
    </div>
  );
}

export default function DocsIndex() {
  const location = useLocation();

  return (
    <DocsLayout currentPath={location.pathname}>
      <div className="space-y-12">
        {/* Changelogs */}
        <section>
          <div className="flex items-baseline justify-between mb-6">
            <h2 className="font-serif text-2xl text-[#1A1A1A]">
              Latest Changelog
            </h2>
            <span className="h-eyebrow text-[#FF3B30]">Phase 5</span>
          </div>
          <p className="text-[#6B6B6B] mb-6">
            Content, SEO, and functional completeness — closing the gaps from the enterprise E2E audit.
          </p>
          <CardList items={PHASE_5_ITEMS} />
          <div className="mt-6">
            <Link
              to="/docs/phase5-functional-changelog"
              className="h-link inline-flex items-center gap-2"
            >
              Read full Phase 5 changelog →
            </Link>
          </div>
        </section>

        {/* Design System */}
        <section>
          <h2 className="font-serif text-2xl text-[#1A1A1A] mb-6">
            Design System
          </h2>
          <CardList items={DESIGN_SYSTEM_ITEMS} />
        </section>
      </div>
    </DocsLayout>
  );
}
