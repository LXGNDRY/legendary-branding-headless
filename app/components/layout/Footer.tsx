import {Link} from 'react-router';
import Container from '~/components/ui/Container';

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
      <h4 className="text-[0.65rem] font-semibold tracking-[0.15em] uppercase text-black mb-5">
        {heading}
      </h4>
      <ul className="space-y-3">
        {links.map(({label, href}) => (
          <li key={href}>
            <Link
              to={href}
              prefetch="intent"
              className="text-xs text-black/60 hover:text-black tracking-wide transition-colors"
            >
              {label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function Footer() {
  return (
    <footer className="border-t border-[#e5e5e5] bg-white mt-auto">
      <Container className="py-16">
        {/* Top: brand + newsletter */}
        <div className="grid md:grid-cols-2 gap-12 mb-16">
          <div className="max-w-sm">
            <Link
              to="/"
              className="inline-block text-base font-bold tracking-[0.25em] uppercase text-black select-none"
              style={{fontFamily: 'var(--font-display)'}}
            >
              LEGENDARY
            </Link>
            <p className="mt-3 text-xs text-black/60 tracking-wide">
              Premium editorial streetwear.
            </p>
          </div>

          {/* Newsletter */}
          <div>
            <h4 className="text-[0.65rem] font-semibold tracking-[0.15em] uppercase text-black mb-4">
              Stay Legendary
            </h4>
            <p className="text-xs text-black/60 mb-4">
              Get early access to drops, exclusive offers, and more.
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
                className="flex-1 border border-[#e5e5e5] border-r-0 px-4 py-3 text-xs tracking-wide placeholder:text-black/40 outline-none focus:border-black transition-colors bg-white"
              />
              <button
                type="submit"
                className="px-5 py-3 bg-black text-white text-[0.65rem] font-semibold tracking-[0.15em] uppercase hover:bg-black/80 transition-colors whitespace-nowrap"
              >
                Join →
              </button>
            </form>
          </div>
        </div>

        {/* Middle: link columns */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-10 mb-16 pt-10 border-t border-[#e5e5e5]">
          <FooterColumn heading="Shop" links={SHOP_LINKS} />
          <FooterColumn heading="Info" links={INFO_LINKS} />
          <FooterColumn heading="Legal" links={LEGAL_LINKS} />
        </div>

        {/* Bottom bar */}
        <div className="border-t border-[#e5e5e5] pt-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <p className="text-[0.7rem] text-black/50 tracking-wide">
            © {new Date().getFullYear()} Legendary Branding®. All rights reserved.
          </p>

          <div className="flex items-center gap-5">
            {SOCIAL_LINKS.map(({label, href}) => (
              <a
                key={label}
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[0.7rem] text-black/50 hover:text-black tracking-wide transition-colors"
              >
                {label}
              </a>
            ))}
          </div>
        </div>
      </Container>
    </footer>
  );
}
