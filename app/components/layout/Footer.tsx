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

function FooterColumn({
  heading,
  links,
}: {
  heading: string;
  links: {label: string; href: string}[];
}) {
  return (
    <div>
      <h3 className="text-[10px] font-semibold tracking-widest uppercase text-[#0a0a0a] mb-5">
        {heading}
      </h3>
      <ul className="space-y-3">
        {links.map(({label, href}) => (
          <li key={href}>
            <Link
              to={href}
              className="text-xs text-[#6b6b6b] hover:text-[#0a0a0a] tracking-wide transition-colors"
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
        {/* Top: wordmark + tagline */}
        <div className="mb-14">
          <Link
            to="/"
            className="text-base font-bold tracking-[0.25em] uppercase text-[#0a0a0a] select-none"
          >
            LEGENDARY
          </Link>
          <p className="mt-2 text-xs text-[#6b6b6b] tracking-wide">
            Premium editorial streetwear.
          </p>
        </div>

        {/* Middle: link columns */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-10 mb-14">
          <FooterColumn heading="Shop" links={SHOP_LINKS} />
          <FooterColumn heading="Info" links={INFO_LINKS} />
          <FooterColumn heading="Legal" links={LEGAL_LINKS} />
        </div>

        {/* Newsletter (UI only — wired up in later milestone) */}
        <div className="border-t border-[#e5e5e5] pt-10 mb-10">
          <p className="text-[10px] font-semibold tracking-widest uppercase text-[#0a0a0a] mb-4">
            Stay Legendary
          </p>
          <form
            onSubmit={(e) => e.preventDefault()}
            className="flex max-w-sm gap-0"
          >
            <label htmlFor="footer-email" className="sr-only">
              Email address
            </label>
            <input
              id="footer-email"
              type="email"
              placeholder="your@email.com"
              className="flex-1 border border-[#e5e5e5] border-r-0 px-4 py-3 text-xs tracking-wide placeholder:text-[#999999] outline-none focus:border-[#0a0a0a] transition-colors"
            />
            <button
              type="submit"
              className="px-5 py-3 bg-[#0a0a0a] text-white text-[10px] font-semibold tracking-widest uppercase hover:bg-[#333333] transition-colors whitespace-nowrap"
            >
              Subscribe
            </button>
          </form>
        </div>

        {/* Bottom: copyright */}
        <div className="border-t border-[#e5e5e5] pt-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <p className="text-[11px] text-[#999999] tracking-wide">
            © {new Date().getFullYear()} Legendary Branding®. All rights reserved.
          </p>
          <p className="text-[11px] text-[#999999] tracking-wide">
            legendary-branding.com
          </p>
        </div>
      </Container>
    </footer>
  );
}
