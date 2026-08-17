import {Link, useLocation} from 'react-router';
import {useState, useEffect, useRef} from 'react';
import {useWishlist} from '~/components/ui/Wishlist';
import SearchTypeahead from '~/components/ui/SearchTypeahead';

/* ── Nav data ──────────────────────────────────────────────────────────── */

interface NavLink {
  label: string;
  href: string;
  isNew?: boolean;
  isSale?: boolean;
}

interface NavGroup {
  label: string;
  links: NavLink[];
}

interface NavItem {
  label: string;
  href: string;
  groups?: NavGroup[];
}

const NAV: NavItem[] = [
  {label: 'New', href: '/collections/all-products', groups: [
    {label: 'Just Dropped', links: [
      {label: 'New Arrivals', href: '/collections/all-products', isNew: true},
      {label: 'Best Sellers', href: '/collections/all-products'},
    ]},
    {label: 'Categories', links: [
      {label: 'T-Shirts', href: '/collections/shirts-tops'},
      {label: 'Hoodies & Jackets', href: '/collections/hoodies-jackets'},
      {label: 'Sets', href: '/collections/sets'},
      {label: 'Accessories', href: '/collections/accessories-more'},
    ]},
    {label: 'Collections', links: [
      {label: 'Marque Légendaire', href: '/collections/marque-legendaire-luxury-streetwear'},
      {label: 'Legendary Select', href: '/collections/legendary-select'},
    ]},
  ]},
  {label: 'Shop', href: '/collections/all-products'},
  {label: 'Lookbook', href: '/journal'},
  {label: 'Journal', href: '/journal'},
  {label: 'About', href: '/policies/about'},
];

/* ── Icons ────────────────────────────────────────────────────────────── */

function SearchIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" aria-hidden="true">
      <circle cx="8.5" cy="8.5" r="5.5" />
      <path d="M19 19l-4-4" />
    </svg>
  );
}

function CartIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M6 2L3 6v12a1 1 0 001 1h12a1 1 0 001-1V6l-3-4z" />
      <path d="M3 6h14" />
      <path d="M13 10a3 3 0 01-6 0" />
    </svg>
  );
}

function WishlistIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5" aria-hidden="true">
      <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" />
    </svg>
  );
}

function UserIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" aria-hidden="true">
      <circle cx="10" cy="7" r="4" />
      <path d="M3 18a7 7 0 0114 0" />
    </svg>
  );
}

function MenuIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 22 22" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" aria-hidden="true">
      <path d="M3 6h16M3 11h16M3 16h10" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 22 22" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" aria-hidden="true">
      <path d="M4 4l14 14M18 4L4 18" />
    </svg>
  );
}

/* ── Badge counter ────────────────────────────────────────────────────── */

function CountBadge({count}: {count: number}) {
  if (!count) return null;
  return (
    <span className="absolute -top-1 -right-1 min-w-[16px] h-4 flex items-center justify-center bg-[#FF3B30] text-white text-[9px] font-bold rounded-full px-1 leading-none">
      {count > 99 ? '99+' : count}
    </span>
  );
}

/* ── Mega dropdown ────────────────────────────────────────────────────── */

function MegaDropdown({item, onClose}: {item: NavItem; onClose: () => void}) {
  if (!item.groups) return null;
  return (
    <div className="absolute top-full left-0 w-full bg-[#FAF9F6] border-t border-b border-[#E8E6E1] shadow-sm z-[200]">
      <div className="max-w-screen-xl mx-auto px-[clamp(1rem,4vw,2.5rem)] py-10 grid grid-cols-4 gap-10">
        {/* Featured placeholder — left 1 col */}
        <div className="col-span-1 bg-[#F3F2EE] aspect-[3/4] flex items-end p-5">
          <span className="text-[10px] tracking-widest uppercase text-[#6B6B6B]">
            {item.label}
          </span>
        </div>

        {/* Link groups — right 3 cols */}
        <div className="col-span-3 grid grid-cols-3 gap-8">
          {item.groups.map((group) => (
            <div key={group.label}>
              <p className="h-eyebrow mb-5">{group.label}</p>
              <ul className="space-y-3">
                {group.links.map((link) => (
                  <li key={link.href}>
                    <Link
                      to={link.href}
                      onClick={onClose}
                      className="group flex items-center gap-2 text-[0.9rem] text-[#1A1A1A] hover:text-[#6B6B6B] transition-colors"
                    >
                      {link.label}
                      {link.isNew && (
                        <span className="text-[9px] font-semibold tracking-widest uppercase bg-[#FF3B30] text-white px-1.5 py-0.5 rounded-full">
                          New
                        </span>
                      )}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ── Mobile menu ──────────────────────────────────────────────────────── */

function MobileMenu({
  open,
  onClose,
  isLoggedIn,
}: {
  open: boolean;
  onClose: () => void;
  isLoggedIn: boolean;
}) {
  return (
    <div
      className={`fixed inset-0 z-[1000] flex flex-col bg-[#FAF9F6] transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] ${
        open ? 'translate-y-0' : '-translate-y-full'
      }`}
      aria-modal="true"
      role="dialog"
      aria-label="Main menu"
    >
      <div className="flex items-center justify-between px-5 h-16 border-b border-[#E8E6E1]">
        <Link
          to="/"
          onClick={onClose}
          className="font-serif text-xl text-[#1A1A1A]"
        >
          LEGENDARY
        </Link>
        <button
          onClick={onClose}
          className="p-2 text-[#1A1A1A] hover:text-[#6B6B6B] transition-colors"
          aria-label="Close menu"
        >
          <CloseIcon />
        </button>
      </div>

      <nav className="flex-1 overflow-y-auto px-6 pt-10 pb-8">
        <ul className="space-y-6 mb-12">
          {NAV.map((item) => (
            <li key={item.href}>
              <Link
                to={item.href}
                onClick={onClose}
                className="font-serif text-[clamp(2rem,8vw,3rem)] leading-none text-[#1A1A1A] hover:text-[#6B6B6B] transition-colors"
              >
                {item.label}
              </Link>
            </li>
          ))}
        </ul>

        <div className="border-t border-[#E8E6E1] pt-8 space-y-4">
          <Link
            to={isLoggedIn ? '/account' : '/account/login'}
            onClick={onClose}
            className="h-eyebrow block hover:text-[#1A1A1A] transition-colors"
          >
            {isLoggedIn ? 'My Account' : 'Sign In'}
          </Link>
          <Link
            to="/wishlist"
            onClick={onClose}
            className="h-eyebrow block hover:text-[#1A1A1A] transition-colors"
          >
            Wishlist
          </Link>
          {isLoggedIn && (
            <a
              href="/account/logout"
              className="h-eyebrow block hover:text-[#1A1A1A] transition-colors"
            >
              Sign Out
            </a>
          )}
        </div>
      </nav>
    </div>
  );
}

/* ── Main Header ──────────────────────────────────────────────────────── */

interface HeaderProps {
  cartCount?: number;
  isLoggedIn?: boolean;
  onOpenCart?: () => void;
}

export default function Header({
  cartCount = 0,
  isLoggedIn = false,
  onOpenCart,
}: HeaderProps) {
  const [scrolled, setScrolled] = useState(false);
  const [activeNav, setActiveNav] = useState<string | null>(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const {count: wishlistCount} = useWishlist();
  const location = useLocation();
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Close menu on route change
  useEffect(() => {
    setMobileOpen(false);
    setSearchOpen(false);
    setActiveNav(null);
  }, [location.pathname]);

  // Scroll detection
  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 16);
    window.addEventListener('scroll', handler, {passive: true});
    return () => window.removeEventListener('scroll', handler);
  }, []);

  function openDropdown(label: string) {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    setActiveNav(label);
  }

  function scheduleClose() {
    closeTimer.current = setTimeout(() => setActiveNav(null), 120);
  }

  function cancelClose() {
    if (closeTimer.current) clearTimeout(closeTimer.current);
  }

  const activeItem = NAV.find((n) => n.label === activeNav);

  return (
    <>
      <header
        className={`sticky top-0 z-[100] transition-all duration-300 ${
          scrolled
            ? 'bg-[#FAF9F6]/95 backdrop-blur-md border-b border-[#E8E6E1] shadow-[0_1px_0_rgba(26,26,26,0.04)]'
            : 'bg-[#FAF9F6] border-b border-transparent'
        }`}
      >
        <div className="max-w-screen-xl mx-auto px-[clamp(1rem,4vw,2.5rem)]">
          <div className="flex items-center justify-between h-16 gap-8">
            {/* Mobile: hamburger */}
            <button
              className="md:hidden p-1.5 text-[#1A1A1A] hover:text-[#6B6B6B] transition-colors"
              onClick={() => setMobileOpen(true)}
              aria-label="Open menu"
              aria-expanded={mobileOpen}
            >
              <MenuIcon />
            </button>

            {/* Wordmark */}
            <Link
              to="/"
              className="font-serif text-[1.35rem] tracking-tight text-[#1A1A1A] select-none shrink-0"
            >
              LEGENDARY
            </Link>

            {/* Desktop nav */}
            <nav
              className="hidden md:flex items-center gap-7 flex-1 justify-center"
              aria-label="Main"
            >
              {NAV.map((item) => (
                <div
                  key={item.label}
                  className="relative"
                  onMouseEnter={() => item.groups && openDropdown(item.label)}
                  onMouseLeave={() => item.groups && scheduleClose()}
                >
                  <Link
                    to={item.href}
                    className={`h-eyebrow py-1 relative transition-colors hover:text-[#1A1A1A] ${
                      activeNav === item.label ? 'text-[#1A1A1A]' : ''
                    }`}
                  >
                    {item.label}
                    <span className="absolute bottom-0 left-0 w-full h-px bg-[#1A1A1A] scale-x-0 transition-transform duration-200 origin-left group-hover:scale-x-100" />
                  </Link>
                </div>
              ))}
            </nav>

            {/* Right icons */}
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => setSearchOpen((s) => !s)}
                className="p-2 text-[#1A1A1A] hover:text-[#6B6B6B] transition-colors"
                aria-label={searchOpen ? 'Close search' : 'Search'}
                aria-expanded={searchOpen}
              >
                <SearchIcon />
              </button>

              <Link
                to={isLoggedIn ? '/account' : '/account/login'}
                className="hidden sm:flex p-2 text-[#1A1A1A] hover:text-[#6B6B6B] transition-colors"
                aria-label={isLoggedIn ? 'My Account' : 'Sign In'}
              >
                <UserIcon />
              </Link>

              <Link
                to="/wishlist"
                className="relative hidden sm:flex p-2 text-[#1A1A1A] hover:text-[#6B6B6B] transition-colors"
                aria-label={`Wishlist${wishlistCount > 0 ? ` (${wishlistCount} items)` : ''}`}
              >
                <WishlistIcon />
                <CountBadge count={wishlistCount} />
              </Link>

              <button
                type="button"
                onClick={onOpenCart}
                className="relative p-2 text-[#1A1A1A] hover:text-[#6B6B6B] transition-colors"
                aria-label={`Cart${cartCount > 0 ? ` (${cartCount} items)` : ''}`}
              >
                <CartIcon />
                <CountBadge count={cartCount} />
              </button>
            </div>
          </div>

          {/* Search panel */}
          {searchOpen && (
            <div className="border-t border-[#E8E6E1] py-3">
              <SearchTypeahead onClose={() => setSearchOpen(false)} />
            </div>
          )}
        </div>

        {/* Mega dropdown */}
        {activeItem?.groups && (
          <div
            onMouseEnter={cancelClose}
            onMouseLeave={scheduleClose}
          >
            <MegaDropdown
              item={activeItem}
              onClose={() => setActiveNav(null)}
            />
          </div>
        )}
      </header>

      {/* Mobile menu */}
      <MobileMenu
        open={mobileOpen}
        onClose={() => setMobileOpen(false)}
        isLoggedIn={isLoggedIn}
      />
    </>
  );
}
