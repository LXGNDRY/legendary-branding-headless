import {Link, useLocation} from 'react-router';
import {useState, useEffect, useRef} from 'react';
import {useWishlist} from '~/components/ui/Wishlist';
import SearchTypeahead from '~/components/ui/SearchTypeahead';
import {useFocusTrap} from '~/hooks/useFocusTrap';

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
  {label: 'Shop', href: '/collections/all-products', groups: [
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
  {label: 'Collections', href: '/collections'},
  {label: 'Journal', href: '/journal'},
  {label: 'About', href: '/policies/about'},
];

/* ── Icons ────────────────────────────────────────────────────────────── */

function SearchIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" aria-hidden="true">
      <circle cx="8.5" cy="8.5" r="5.5" />
      <path d="M19 19l-4-4" />
    </svg>
  );
}

function CartIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M6 2L3 6v12a1 1 0 001 1h12a1 1 0 001-1V6l-3-4z" />
      <path d="M3 6h14" />
      <path d="M13 10a3 3 0 01-6 0" />
    </svg>
  );
}

function WishlistIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-[18px] h-[18px]" aria-hidden="true">
      <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" />
    </svg>
  );
}

function UserIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" aria-hidden="true">
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

function ChevronDownIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M3 4.5l3 3 3-3" />
    </svg>
  );
}

/* ── Badge counter ────────────────────────────────────────────────────── */

function CountBadge({count}: {count: number}) {
  if (!count) return null;
  return (
    <span className="absolute -top-0.5 -right-0.5 min-w-[15px] h-[15px] flex items-center justify-center bg-[var(--color-accent)] text-white text-[9px] font-bold rounded-full px-1 leading-none">
      {count > 99 ? '99+' : count}
    </span>
  );
}

/* ── Mega dropdown ────────────────────────────────────────────────────── */

function MegaDropdown({item, onClose}: {item: NavItem; onClose: () => void}) {
  if (!item.groups) return null;
  return (
    <div className="absolute top-full left-0 w-full bg-[var(--color-bg-level-1)] border-b border-[var(--color-border-muted)] shadow-lg z-[200]">
      <div className="h-container py-10 grid grid-cols-1 md:grid-cols-4 gap-10">
        {/* Featured visual — left column */}
        <div className="hidden md:block col-span-1 aspect-[3/4] bg-[var(--color-bg-level-2)] rounded-lg overflow-hidden relative group">
          <div className="absolute inset-0 bg-gradient-to-t from-[var(--color-bg-level-0)]/80 via-transparent to-transparent" />
          <div className="absolute bottom-5 left-5 right-5">
            <span className="h-eyebrow block mb-2">{item.label}</span>
            <p className="font-serif text-xl text-[var(--color-text-primary)]">
              Explore the collection
            </p>
          </div>
        </div>

        {/* Link groups — right columns */}
        <div className="col-span-1 md:col-span-3 grid grid-cols-1 sm:grid-cols-3 gap-8">
          {item.groups.map((group) => (
            <div key={group.label}>
              <p className="h-eyebrow mb-5 text-[var(--color-text-tertiary)]">{group.label}</p>
              <ul className="space-y-3">
                {group.links.map((link) => (
                  <li key={link.href}>
                    <Link
                      to={link.href}
                      onClick={onClose}
                      className="group flex items-center gap-2 text-[0.9rem] text-[var(--color-text-primary)] hover:text-[var(--color-accent)] transition-colors"
                    >
                      <span>{link.label}</span>
                      <svg
                        className="w-3 h-3 opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all"
                        viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"
                      >
                        <path d="M2.5 6h7M7 2.5l3 3.5-3 3.5" />
                      </svg>
                      {link.isNew && (
                        <span className="text-[9px] font-semibold tracking-widest uppercase bg-[var(--color-accent)] text-white px-1.5 py-0.5 rounded-full ml-1">
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
  accountsEnabled,
}: {
  open: boolean;
  onClose: () => void;
  isLoggedIn: boolean;
  accountsEnabled: boolean;
}) {
  const {containerRef} = useFocusTrap(open, onClose);

  // Prevent body scroll
  useEffect(() => {
    if (open) {
      const original = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => { document.body.style.overflow = original; };
    }
  }, [open]);

  return (
    <div
      ref={containerRef}
      className={`fixed inset-0 z-[1000] flex flex-col bg-[var(--color-bg-level-0)] transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] ${
        open ? 'translate-y-0' : '-translate-y-full'
      }`}
      aria-modal="true"
      role="dialog"
      aria-label="Main menu"
      aria-hidden={!open}
    >
      <div className="flex items-center justify-between px-5 h-[60px] border-b border-[var(--color-border-muted)]">
        <Link
          to="/"
          onClick={onClose}
          className="font-serif text-xl tracking-tight text-[var(--color-text-primary)]"
        >
          LEGENDARY
        </Link>
        <button
          onClick={onClose}
          className="p-2 text-[var(--color-text-primary)] hover:text-[var(--color-text-secondary)] transition-colors"
          aria-label="Close menu"
        >
          <CloseIcon />
        </button>
      </div>

      <nav className="flex-1 overflow-y-auto px-6 pt-10 pb-8">
        <ul className="space-y-5 mb-12">
          {NAV.map((item) => (
            <li key={item.href} className="border-b border-[var(--color-border-subtle)] pb-4">
              <Link
                to={item.href}
                onClick={onClose}
                className="flex items-center justify-between font-serif text-[clamp(1.75rem,7vw,2.75rem)] leading-none text-[var(--color-text-primary)] hover:text-[var(--color-accent)] transition-colors"
              >
                <span>{item.label}</span>
                <ChevronDownIcon />
              </Link>
            </li>
          ))}
        </ul>

        <div className="space-y-5 pt-6 border-t border-[var(--color-border-muted)]">
          {accountsEnabled && (
            <Link
              to={isLoggedIn ? '/account' : '/account/login'}
              onClick={onClose}
              className="h-eyebrow block text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors"
            >
              {isLoggedIn ? 'My Account' : 'Sign In'}
            </Link>
          )}
          <Link
            to="/wishlist"
            onClick={onClose}
            className="h-eyebrow block text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors"
          >
            Wishlist
          </Link>
          <Link
            to="/search"
            onClick={onClose}
            className="h-eyebrow block text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors"
          >
            Search
          </Link>
          {isLoggedIn && (
            <a
              href="/account/logout"
              className="h-eyebrow block text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors"
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
  accountsEnabled?: boolean;
  onOpenCart?: () => void;
  transparent?: boolean;
}

export default function Header({
  cartCount = 0,
  isLoggedIn = false,
  accountsEnabled = false,
  onOpenCart,
  transparent = false,
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
    const handler = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handler, {passive: true});
    handler();
    return () => window.removeEventListener('scroll', handler);
  }, []);

  function openDropdown(label: string) {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    setActiveNav(label);
  }

  function scheduleClose() {
    closeTimer.current = setTimeout(() => setActiveNav(null), 150);
  }

  function cancelClose() {
    if (closeTimer.current) clearTimeout(closeTimer.current);
  }

  const activeItem = NAV.find((n) => n.label === activeNav);
  const isSolid = scrolled || !transparent || searchOpen || activeNav !== null;

  return (
    <>
      <header
        className={`sticky top-0 z-[100] transition-all duration-300 ease-[var(--ease-expo)] ${
          isSolid
            ? 'bg-[var(--color-bg-level-0)]/90 backdrop-blur-md border-b border-[var(--color-border-muted)]'
            : 'bg-transparent border-b border-transparent'
        }`}
      >
        <div className="h-container">
          <div className="flex items-center justify-between h-[60px] md:h-[68px] gap-4">
            {/* Mobile: hamburger */}
            <button
              className="md:hidden p-1.5 text-[var(--color-text-primary)] hover:text-[var(--color-text-secondary)] transition-colors"
              onClick={() => setMobileOpen(true)}
              aria-label="Open menu"
              aria-expanded={mobileOpen}
            >
              <MenuIcon />
            </button>

            {/* Wordmark */}
            <Link
              to="/"
              className="font-serif text-[1.25rem] md:text-[1.35rem] tracking-tight text-[var(--color-text-primary)] select-none shrink-0"
            >
              LEGENDARY
            </Link>

            {/* Desktop nav */}
            <nav
              className="hidden md:flex items-center gap-8 flex-1 justify-center"
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
                    className="h-eyebrow py-2 relative text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors inline-flex items-center gap-1"
                  >
                    {item.label}
                    {item.groups && <ChevronDownIcon />}
                  </Link>
                </div>
              ))}
            </nav>

            {/* Right icons */}
            <div className="flex items-center gap-1 sm:gap-2 shrink-0">
              <button
                onClick={() => setSearchOpen((s) => !s)}
                className="p-2 text-[var(--color-text-primary)] hover:text-[var(--color-accent)] transition-colors"
                aria-label={searchOpen ? 'Close search' : 'Search'}
                aria-expanded={searchOpen}
              >
                {searchOpen ? <CloseIcon /> : <SearchIcon />}
              </button>

              {accountsEnabled && (
                <Link
                  to={isLoggedIn ? '/account' : '/account/login'}
                  className="hidden sm:flex p-2 text-[var(--color-text-primary)] hover:text-[var(--color-accent)] transition-colors"
                  aria-label={isLoggedIn ? 'My Account' : 'Sign In'}
                >
                  <UserIcon />
                </Link>
              )}

              <Link
                to="/wishlist"
                className="relative hidden sm:flex p-2 text-[var(--color-text-primary)] hover:text-[var(--color-accent)] transition-colors"
                aria-label={`Wishlist${wishlistCount > 0 ? ` (${wishlistCount} items)` : ''}`}
              >
                <WishlistIcon />
                <CountBadge count={wishlistCount} />
              </Link>

              <button
                type="button"
                onClick={onOpenCart}
                className="relative p-2 text-[var(--color-text-primary)] hover:text-[var(--color-accent)] transition-colors"
                aria-label={`Cart${cartCount > 0 ? ` (${cartCount} items)` : ''}`}
              >
                <CartIcon />
                <CountBadge count={cartCount} />
              </button>
            </div>
          </div>

          {/* Search panel */}
          {searchOpen && (
            <div className="border-t border-[var(--color-border-muted)] py-4 animate-[h-fade-in_0.2s_ease-out]">
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
        accountsEnabled={accountsEnabled}
      />
    </>
  );
}
