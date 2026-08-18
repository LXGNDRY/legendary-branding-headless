import {Link} from 'react-router';

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
      <h4 className="h-eyebrow mb-5 text-[#1A1A1A]">
        {heading}
      </h4>
      <ul className="space-y-3">
        {links.map(({label, href}) => (
          <li key={href}>
            <Link
              to={href}
              prefetch="intent"
              className="text-sm text-[#6B6B6B] hover:text-[#1A1A1A] transition-colors"
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
    <footer className="border-t border-[#E8E6E1] bg-[#FAF9F6] mt-auto">
      <div className="h-container py-16 md:py-24">
        {/* Top: brand + newsletter */}
        <div className="grid md:grid-cols-[1.5fr_1fr] gap-16 mb-20 pb-16 border-b border-[#E8E6E1]">
          <div className="max-w-md">
            <Link
              to="/"
              className="inline-block text-[clamp(1.75rem,3vw,2.5rem)] font-serif leading-none text-[#1A1A1A] select-none"
            >
              LEGENDARY
            </Link>
            <p className="mt-4 text-[#6B6B6B] leading-relaxed">
              Premium editorial streetwear — crafted with intention, built to last.
            </p>
          </div>

          {/* Newsletter */}
          <div>
            <h4 className="h-eyebrow mb-4 text-[#1A1A1A]">
              Stay Legendary
            </h4>
            <p className="text-sm text-[#6B6B6B] mb-5">
              Get early access to drops, exclusive offers, and behind-the-scenes content.
            </p>
            <form
              onSubmit={(e) => e.preventDefault()}
              className="flex max-w-sm"
            >
              <label htmlFor="footer-email" className="sr-only">
                Email address
              </label>
              <input
                id="footer-email"
                type="email"
                placeholder="Enter your email"
                required
                className="flex-1 border border-[#E8E6E1] border-r-0 px-4 py-3 text-sm text-[#1A1A1A] placeholder:text-[#9E9C97] outline-none focus:border-[#1A1A1A] transition-colors bg-transparent"
              />
              <button
                type="submit"
                className="px-5 py-3 bg-[#1A1A1A] text-[#FAF9F6] h-eyebrow font-semibold hover:bg-[#FF3B30] transition-colors whitespace-nowrap"
              >
                Join →
              </button>
            </form>
          </div>
        </div>

        {/* Middle: link columns */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-10 mb-16">
          <FooterColumn heading="Shop" links={SHOP_LINKS} />
          <FooterColumn heading="Info" links={INFO_LINKS} />
          <FooterColumn heading="Legal" links={LEGAL_LINKS} />
        </div>

        {/* Bottom bar */}
        <div className="border-t border-[#E8E6E1] pt-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <p className="text-xs text-[#9E9C97] tracking-wide">
            © {new Date().getFullYear()} Legendary Branding®. All rights reserved.
          </p>

          <div className="flex items-center gap-5">
            {SOCIAL_LINKS.map(({label, href}) => (
              <a
                key={label}
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-[#9E9C97] hover:text-[#1A1A1A] tracking-wide transition-colors"
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
