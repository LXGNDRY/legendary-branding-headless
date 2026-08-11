import {Link} from 'react-router';
import {useState} from 'react';
import MobileMenu from './MobileMenu';
import SearchTypeahead from '~/components/ui/SearchTypeahead';
import {useWishlist} from '~/components/ui/Wishlist';

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

function UserIcon() {
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
      <circle cx="10" cy="7" r="4" />
      <path d="M3 18a7 7 0 0114 0" />
    </svg>
  );
}

function HeartIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="w-5 h-5"
      aria-hidden="true"
    >
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
    </svg>
  );
}

function WishlistCount() {
  const {count} = useWishlist();
  if (count === 0) return null;
  return (
    <span
      className="absolute -top-0.5 -right-0.5 min-w-[14px] h-3.5 flex items-center justify-center bg-[#0a0a0a] text-white text-[8px] font-bold rounded-full px-1 leading-none"
      aria-hidden="true"
    >
      {count > 99 ? '99+' : count}
    </span>
  );
}

interface HeaderProps {
  cartCount?: number;
  isLoggedIn?: boolean;
  onOpenCart?: () => void;
}

export default function Header({cartCount = 0, isLoggedIn = false, onOpenCart}: HeaderProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

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
              {/* Search toggle */}
              <button
                onClick={() => setSearchOpen(!searchOpen)}
                className="hidden sm:flex p-1 text-[#0a0a0a] hover:text-[#6b6b6b] transition-colors"
                aria-label={searchOpen ? 'Close search' : 'Search'}
                aria-expanded={searchOpen}
              >
                <SearchIcon />
              </button>

              {/* Account */}
              <Link
                to={isLoggedIn ? '/account' : '/account/login'}
                className="hidden sm:flex p-1 text-[#0a0a0a] hover:text-[#6b6b6b] transition-colors"
                aria-label={isLoggedIn ? 'My Account' : 'Log In'}
              >
                <UserIcon />
              </Link>

              {/* Wishlist */}
              <Link
                to="/wishlist"
                className="relative hidden sm:flex p-1 text-[#0a0a0a] hover:text-[#6b6b6b] transition-colors"
                aria-label="Wishlist"
              >
                <HeartIcon />
                <WishlistCount />
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

          {/* Search bar (expanded) */}
          {searchOpen && (
            <div className="py-3 border-t border-[#e5e5e5]">
              <SearchTypeahead onClose={() => setSearchOpen(false)} />
            </div>
          )}
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
