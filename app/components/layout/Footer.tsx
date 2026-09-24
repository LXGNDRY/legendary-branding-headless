import {Link} from 'react-router';
import NewsletterForm from '~/components/ui/NewsletterForm';
import MarketSelector from '~/components/ui/MarketSelector';
import BrandLogo from '~/components/ui/BrandLogo';
import type {LocalizationData} from '~/lib/market';

const SHOP_LINKS = [
  {label: 'All Products', href: '/collections/all-products'},
  {label: 'T-Shirts', href: '/collections/shirts-tops'},
  {label: 'Hoodies & Jackets', href: '/collections/hoodies-jackets'},
  {label: 'Sets', href: '/collections/sets'},
  {label: 'Accessories', href: '/collections/accessories-more'},
  {label: 'Collections', href: '/collections'},
];

const HELP_LINKS = [
  {label: 'FAQ', href: '/policies/legendary_branding_faqs'},
  {label: 'Shipping', href: '/policies/shipping-policy'},
  {label: 'Returns', href: '/policies/refund-policy'},
  {label: 'Size Guide', href: '/policies/size-guide'},
  {label: 'Contact', href: '/policies/contact'},
];

const COMPANY_LINKS = [
  {label: 'About', href: '/policies/about'},
  {label: 'Journal', href: '/journal'},
  {label: 'Streetwear Guide', href: '/pages/the-ultimate-streetwear-guide'},
  {label: 'Oversized Hoodie Guide', href: '/pages/oversized-hoodies-streetwear-the-piece-that-never-loses'},
];

const LEGAL_LINKS = [
  {label: 'Privacy Policy', href: '/policies/privacy-with-legendary-branding'},
  {label: 'Terms of Service', href: '/policies/terms-of-service'},
  {label: 'Do Not Sell', href: '/pages/data-sharing-opt-out'},
];

// Instagram and TikTok are the only two social profiles actually live for
// this brand -- verified against the store's real social settings. X/Twitter
// and YouTube links were previously fabricated placeholders pointing to
// accounts that don't exist.
const SOCIAL_LINKS = [
  {label: 'Instagram', href: 'https://www.instagram.com/legendary_branding/'},
  {label: 'TikTok', href: 'https://tiktok.com/@legendarybranding'},
];

function FooterColumn({
  heading,
  links,
}: {
  heading: string;
  links: {label: string; href: string}[];
}) {
  return (
    <div>
      <h4 className="h-eyebrow mb-5 text-[var(--color-text-primary)]">
        {heading}
      </h4>
      <ul className="space-y-3">
        {links.map(({label, href}) => (
          <li key={href}>
            <Link
              to={href}
              prefetch="intent"
              className="text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-accent)] transition-colors"
            >
              {label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

/**
 * ONYX — Footer
 * Premium dark theme footer with brand statement, newsletter,
 * three link columns, social links, and copyright.
 */
export default function Footer({localization}: {localization: LocalizationData}) {
  return (
    <footer className="border-t border-[var(--color-border-muted)] bg-[var(--color-bg-level-1)] mt-auto">
      <div className="h-container py-16 md:py-24">
        {/* Top: brand statement + newsletter */}
        <div className="grid lg:grid-cols-[1.2fr_1fr] gap-10 lg:gap-20 mb-12 lg:mb-16 pb-12 lg:pb-16 border-b border-[var(--color-border-muted)]">
          <div className="max-w-lg">
            <Link
              to="/"
              className="inline-flex items-center gap-3 text-[clamp(2rem,4vw,3rem)] font-serif leading-none text-[var(--color-text-primary)] select-none"
            >
              <BrandLogo className="h-[0.85em] w-[0.85em] shrink-0" />
              LEGENDARY
            </Link>
            <p className="mt-5 text-[var(--color-text-secondary)] leading-relaxed">
              Premium streetwear crafted with intention. Designed for the bold.
              Built to last, season after season, drop after drop.
            </p>
          </div>

          {/* Newsletter */}
          <div>
            <h4 className="h-eyebrow mb-3 text-[var(--color-text-primary)]">
              Enter The List
            </h4>
            <p className="text-sm text-[var(--color-text-secondary)] mb-5">
              First access to new drops, exclusive releases, and members-only offers.
            </p>
            <NewsletterForm source="footer" variant="footer" buttonText="Subscribe →" placeholder="Email address" />
          </div>
        </div>

        {/* Middle: link columns */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-x-8 gap-y-10 mb-12 lg:mb-16">
          <FooterColumn heading="Shop" links={SHOP_LINKS} />
          <FooterColumn heading="Help" links={HELP_LINKS} />
          <FooterColumn heading="Company" links={COMPANY_LINKS} />
          <FooterColumn heading="Legal" links={LEGAL_LINKS} />
        </div>

        {/* Bottom bar */}
        <div className="border-t border-[var(--color-border-muted)] pt-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-5">
          <p className="text-xs text-[var(--color-text-tertiary)] tracking-wide">
            © {new Date().getFullYear()} Legendary Branding®. All rights reserved.
          </p>

          <div className="flex items-center gap-6 flex-wrap">
            <MarketSelector
              current={localization.country}
              countries={localization.availableCountries}
              language={localization.language}
              languages={localization.availableLanguages}
            />
            {SOCIAL_LINKS.map(({label, href}) => (
              <a
                key={label}
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)] tracking-wide transition-colors"
              >
                {label}
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
