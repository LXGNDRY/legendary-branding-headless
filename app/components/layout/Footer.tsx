import {Link} from 'react-router';
import NewsletterForm from '~/components/ui/NewsletterForm';

const SHOP_LINKS = [
  {label: 'New Drops', href: '/collections/all-products'},
  {label: 'T-Shirts', href: '/collections/shirts-tops'},
  {label: 'Outerwear', href: '/collections/hoodies-jackets'},
  {label: 'Accessories', href: '/collections/accessories-more'},
  {label: 'Sets', href: '/collections/sets'},
  {label: 'Marque Légendaire', href: '/collections/marque-legendaire-luxury-streetwear'},
];

const INFO_LINKS = [
  {label: 'About', href: '/policies/about'},
  {label: 'FAQ', href: '/policies/legendary_branding_faqs'},
  {label: 'Contact', href: '/policies/contact'},
  {label: 'Size Guide', href: '/policies/size-guide'},
  {label: 'Journal', href: '/journal'},
];

const GUIDES_LINKS = [
  {label: 'Streetwear Guide', href: '/pages/the-ultimate-streetwear-guide'},
  {label: 'Oversized Hoodie Guide', href: '/pages/oversized-hoodies-streetwear-the-piece-that-never-loses'},
];

const LEGAL_LINKS = [
  {label: 'Refund & Returns', href: '/policies/refund-policy'},
  {label: 'Privacy Policy', href: '/policies/privacy-with-legendary-branding'},
  {label: 'Terms of Service', href: '/policies/terms-of-service'},
  {label: 'Shipping Policy', href: '/policies/shipping-policy'},
  {label: 'Do Not Sell My Info', href: '/pages/data-sharing-opt-out'},
];

const SOCIAL_LINKS = [
  {label: 'Instagram', href: 'https://instagram.com/legendarybranding'},
  {label: 'TikTok', href: 'https://tiktok.com/@legendarybranding'},
  {label: 'X / Twitter', href: 'https://twitter.com/legendarybrand'},
  {label: 'YouTube', href: 'https://youtube.com/@legendarybranding'},
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
      <h4 className="h-eyebrow mb-5 text-[var(--color-foreground)]">
        {heading}
      </h4>
      <ul className="space-y-3">
        {links.map(({label, href}) => (
          <li key={href}>
            <Link
              to={href}
              prefetch="intent"
              className="text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-foreground)] transition-colors"
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
 * HANSSEN — Footer
 * Editorial footer with serif brand wordmark, newsletter signup,
 * 3 link columns, and social links.
 */
export default function Footer() {
  return (
    <footer className="border-t border-[var(--color-border-subtle)] bg-[var(--color-background)] mt-auto">
      <div className="h-container py-16 md:py-24">
        {/* Top: brand + newsletter */}
        <div className="grid md:grid-cols-[1.5fr_1fr] gap-16 mb-20 pb-16 border-b border-[var(--color-border-subtle)]">
          <div className="max-w-md">
            <Link
              to="/"
              className="inline-block text-[clamp(1.75rem,3vw,2.5rem)] font-serif leading-none text-[var(--color-foreground)] select-none"
            >
              LEGENDARY
            </Link>
            <p className="mt-4 text-[var(--color-text-secondary)] leading-relaxed">
              Premium editorial streetwear — crafted with intention, built to last.
            </p>
          </div>

          {/* Newsletter */}
          <div>
            <h4 className="h-eyebrow mb-4 text-[var(--color-foreground)]">
              Stay Legendary
            </h4>
            <p className="text-sm text-[var(--color-text-secondary)] mb-5">
              Get early access to drops, exclusive offers, and behind-the-scenes content.
            </p>
            <NewsletterForm source="footer" variant="footer" buttonText="Join →" placeholder="Enter your email" />
          </div>
        </div>

        {/* Middle: link columns */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-10 mb-16">
          <FooterColumn heading="Shop" links={SHOP_LINKS} />
          <FooterColumn heading="Info" links={INFO_LINKS} />
          <FooterColumn heading="Guides" links={GUIDES_LINKS} />
          <FooterColumn heading="Legal" links={LEGAL_LINKS} />
        </div>

        {/* Bottom bar */}
        <div className="border-t border-[var(--color-border-subtle)] pt-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <p className="text-xs text-[var(--color-text-tertiary)] tracking-wide">
            © {new Date().getFullYear()} Legendary Branding®. All rights reserved.
          </p>

          <div className="flex items-center gap-5">
            {SOCIAL_LINKS.map(({label, href}) => (
              <a
                key={label}
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-[var(--color-text-tertiary)] hover:text-[var(--color-foreground)] tracking-wide transition-colors"
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
