import {Link} from 'react-router';
import {useState} from 'react';
import MobileMenu from './MobileMenu';

const NAV_LINKS = [
  {label: 'NEW DROPS', href: '/collections/all-products'},
  {label: 'T-SHIRTS', href: '/collections/shirts-tops'},
  {label: 'OUTERWEAR', href: '/collections/hoodies-jackets'},
  {label: 'ACCESSORIES', href: '/collections/accessories-more'},
  {label: 'JOURNAL', href: '/journal'},
];

function CartIcon() {
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 22 22"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.4"
      aria-hidden="true"
    >
      <path d="M6 2L3 6v14a2 2 0 002 2h12a2 2 0 002-2V6l-3-4z" />
      <path d="M3 6h16" />
      <path d="M14 10a3 3 0 01-6 0" />
    </svg>
  );
}

function SearchIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.4"
      aria-hidden="true"
    >
      <circle cx="9" cy="9" r="6" />
      <path d="M20 20l-4.35-4.35" />
    </svg>
  );
}

function HamburgerIcon() {
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 22 22"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.4"
      aria-hidden="true"
    >
      <path d="M3 6h16M3 11h16M3 16h16" />
    </svg>
  );
}

interface HeaderProps {
  cartCount?: number;
  onOpenCart?: () => void;
}

export default function Header({cartCount = 0, onOpenCart}: HeaderProps) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <>
      <header className="sticky top-0 z-40 bg-white border-b border-[#e5e5e5]">
        <div className="max-w-screen-xl mx-auto px-[clamp(1rem,4vw,2.5rem)]">
          <div className="flex items-center justify-between h-16 gap-6">
            {/* Wordmark */}
            <Link
              to="/"
              className="shrink-0 text-sm font-bold tracking-[0.25em] text-[#0a0a0a] uppercase select-none"
            >
              LEGENDARY
            </Link>

            {/* Desktop nav */}
            <nav className="hidden md:flex items-center gap-7" aria-label="Main">
              {NAV_LINKS.map(({label, href}) => (
                <Link
                  key={href}
                  to={href}
                  className="text-[11px] font-medium tracking-[0.18em] text-[#0a0a0a] hover:text-[#6b6b6b] transition-colors uppercase whitespace-nowrap"
                >
                  {label}
                </Link>
              ))}
            </nav>

            {/* Right actions */}
            <div className="flex items-center gap-3 shrink-0">
              {/* Search */}
              <Link
                to="/search"
                className="hidden sm:flex p-1 text-[#0a0a0a] hover:text-[#6b6b6b] transition-colors"
                aria-label="Search"
              >
                <SearchIcon />
              </Link>

              {/* Cart */}
              <button
                type="button"
                onClick={onOpenCart}
                className="relative p-1 text-[#0a0a0a] hover:text-[#6b6b6b] transition-colors"
                aria-label={`Cart${cartCount > 0 ? ` (${cartCount} items)` : ''}`}
              >
                <CartIcon />
                {cartCount > 0 && (
                  <span
                    className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 flex items-center justify-center bg-[#0a0a0a] text-white text-[9px] font-bold rounded-full px-1 leading-none"
                    aria-hidden="true"
                  >
                    {cartCount > 99 ? '99+' : cartCount}
                  </span>
                )}
              </button>

              {/* Mobile hamburger */}
              <button
                className="md:hidden p-1 text-[#0a0a0a] hover:text-[#6b6b6b] transition-colors"
                onClick={() => setMobileOpen(true)}
                aria-label="Open menu"
                aria-expanded={mobileOpen}
              >
                <HamburgerIcon />
              </button>
            </div>
          </div>
        </div>
      </header>

      <MobileMenu
        open={mobileOpen}
        onClose={() => setMobileOpen(false)}
        links={NAV_LINKS}
      />
    </>
  );
}
