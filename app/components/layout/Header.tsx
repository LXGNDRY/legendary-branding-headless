import {Link} from 'react-router';
import {useState, useRef, useEffect} from 'react';
import MobileMenu from './MobileMenu';
import SearchTypeahead from '~/components/ui/SearchTypeahead';
import {useWishlist} from '~/components/ui/Wishlist';

/**
 * HANSSEN x LEGENDARY — Header
 *
 * Off-white transparent header with no border by default.
 * On scroll: backdrop blur + subtle bottom border.
 * Mega dropdown on hover for desktop.
 * Full-screen overlay menu on mobile.
 */

const NAV_LINKS = [
  {
    label: 'New',
    href: '/collections/new-arrivals',
    hasDropdown: true,
    badge: 'New',
    dropdown: {
      featuredImage: '',
      groups: [
        {
          label: 'Shop by',
          links: [
            {label: 'All new arrivals', href: '/collections/new-arrivals', badge: 'New'},
            {label: 'Best sellers', href: '/collections/best-sellers', badge: 'Hot'},
            {label: 'Back in stock', href: '/collections/back-in-stock'},
          ],
        },
        {
          label: 'Categories',
          links: [
            {label: 'Tees & Tops', href: '/collections/tees-tops'},
            {label: 'Hoodies & Crewnecks', href: '/collections/hoodies'},
            {label: 'Outerwear', href: '/collections/outerwear'},
            {label: 'Bottoms', href: '/collections/bottoms'},
            {label: 'Accessories', href: '/collections/accessories'},
          ],
        },
        {
          label: 'Drops',
          links: [
            {label: 'Fall 2025', href: '/collections/fall-2025', badge: 'New'},
            {label: 'Summer 2025', href: '/collections/summer-2025'},
            {label: 'Archive', href: '/collections/archive'},
          ],
        },
      ],
    },
  },
  {label: 'Shop', href: '/collections/all-products', hasDropdown: true},
  {label: 'Lookbook', href: '/lookbook', hasDropdown: false},
  {label: 'Journal', href: '/journal', hasDropdown: false},
  {label: 'About', href: '/pages/about', hasDropdown: false},
];

interface HeaderProps {
  cartCount?: number;
  isLoggedIn?: boolean;
  onOpenCart?: () => void;
}

export default function Header({cartCount = 0, isLoggedIn = false, onOpenCart}: HeaderProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<number | null>(null);
  const [scrolled, setScrolled] = useState(false);
  const dropdownTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const navRef = useRef<HTMLUListElement>(null);

  // Scroll effect: add background blur + border on scroll
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    handleScroll();
    window.addEventListener('scroll', handleScroll, {passive: true});
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  function handleMouseEnter(index: number) {
    if (dropdownTimer.current) {
      clearTimeout(dropdownTimer.current);
      dropdownTimer.current = null;
    }
    setActiveDropdown(index);
  }

  function handleMouseLeave() {
    dropdownTimer.current = setTimeout(() => {
      setActiveDropdown(null);
    }, 100);
  }

  const activeNav = activeDropdown !== null ? NAV_LINKS[activeDropdown] : null;
  const hasActiveDropdown = activeNav?.hasDropdown;

  return (
    <>
      <header
        className={`sticky top-0 z-[100] w-full transition-all duration-300 ${
          scrolled
            ? 'bg-[#FAF9F6]/90 backdrop-blur-md border-b border-[#E8E6E1]'
            : 'bg-transparent border-b border-transparent'
        }`}
      >
        <div className="max-w-[1280px] mx-auto px-[clamp(1.25rem,4vw,2.5rem)]">
          <div className="flex items-center justify-between h-16 md:h-20 gap-8">
            {/* Left: mobile hamburger + search icon */}
            <div className="flex items-center gap-2 shrink-0 md:hidden">
              <button
                className="p-1 text-[#1A1A1A] hover:text-[#6B6B6B] transition-colors"
                onClick={() => setMobileOpen(true)}
                aria-label="Open menu"
                aria-expanded={mobileOpen}
              >
                <HamburgerIcon />
              </button>
              <button
                onClick={() => setSearchOpen(!searchOpen)}
                className="p-1 text-[#1A1A1A] hover:text-[#6B6B6B] transition-colors"
                aria-label={searchOpen ? 'Close search' : 'Search'}
              >
                <SearchIcon />
              </button>
            </div>

            {/* Wordmark — left on desktop, center on mobile */}
            <Link
              to="/"
              className="shrink-0 text-xl md:text-2xl font-serif tracking-tight text-[#1A1A1A] select-none"
              aria-label="Legendary home"
            >
              LEGENDARY
            </Link>

            {/* Desktop nav */}
            <nav
              className="hidden md:flex flex-1 items-center justify-center"
              aria-label="Main navigation"
            >
              <ul
                ref={navRef}
                className="flex items-center gap-8"
                onMouseLeave={handleMouseLeave}
              >
                {NAV_LINKS.map((link, i) => (
                  <li
                    key={link.href}
                    className="relative"
                    onMouseEnter={() => handleMouseEnter(i)}
                  >
                    <Link
                      to={link.href}
                      className="text-xs font-medium tracking-[0.15em] uppercase text-[#1A1A1A] hover:text-[#6B6B6B] transition-colors inline-flex items-center gap-1.5 py-1"
                    >
                      {link.label}
                      {link.hasDropdown && (
                        <ChevronDownIcon className="w-3 h-3" />
                      )}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>

            {/* Right icons */}
            <div className="flex items-center gap-3 shrink-0">
              {/* Desktop search */}
              <button
                onClick={() => setSearchOpen(!searchOpen)}
                className="hidden md:flex p-1 text-[#1A1A1A] hover:text-[#6B6B6B] transition-colors"
                aria-label={searchOpen ? 'Close search' : 'Search'}
                aria-expanded={searchOpen}
              >
                <SearchIcon />
              </button>

              {/* Desktop account */}
              <Link
                to={isLoggedIn ? '/account' : '/account/login'}
                className="hidden md:flex p-1 text-[#1A1A1A] hover:text-[#6B6B6B] transition-colors"
                aria-label={isLoggedIn ? 'My Account' : 'Log In'}
              >
                <UserIcon />
              </Link>

              {/* Desktop wishlist */}
              <Link
                to="/wishlist"
                className="relative hidden md:flex p-1 text-[#1A1A1A] hover:text-[#6B6B6B] transition-colors"
                aria-label="Wishlist"
              >
                <HeartIcon />
                <WishlistCount />
              </Link>

              {/* Cart */}
              <button
                type="button"
                onClick={onOpenCart}
                className="relative p-1 text-[#1A1A1A] hover:text-[#6B6B6B] transition-colors"
                aria-label={`Cart${cartCount > 0 ? ` (${cartCount} items)` : ''}`}
              >
                <BagIcon />
                {cartCount > 0 && (
                  <span
                    className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 flex items-center justify-center bg-[#FF3B30] text-white text-[9px] font-bold rounded-full px-1 leading-none"
                    aria-hidden="true"
                  >
                    {cartCount > 99 ? '99+' : cartCount}
                  </span>
                )}
              </button>

              {/* Mobile cart and wordmark spacing handled above */}
            </div>
          </div>

          {/* Search bar (expanded) */}
          {searchOpen && (
            <div className="py-4 border-t border-[#E8E6E1] animate-[slideDown_0.2s_ease-out]">
              <SearchTypeahead onClose={() => setSearchOpen(false)} />
            </div>
          )}
        </div>

        {/* Mega dropdown */}
        {hasActiveDropdown && activeNav?.dropdown && (
          <div
            className="hidden md:block absolute left-0 right-0 top-full bg-[#FAF9F6] border-b border-[#E8E6E1] shadow-lg z-50 animate-[fadeDown_0.2s_ease-out]"
            onMouseEnter={() => {
              if (dropdownTimer.current) clearTimeout(dropdownTimer.current);
            }}
            onMouseLeave={handleMouseLeave}
          >
            <div className="max-w-[1280px] mx-auto px-[clamp(1.25rem,4vw,2.5rem)] py-8">
              <div className="grid grid-cols-4 gap-8">
                {/* Featured image column */}
                <div className="relative aspect-[3/4] bg-[#E8E6E1] overflow-hidden group">
                  <div className="absolute inset-0 bg-gradient-to-t from-[#1A1A1A]/20 to-transparent z-10" />
                  <div className="absolute bottom-4 left-4 z-20">
                    <p className="text-white/90 text-xs uppercase tracking-widest mb-1">
                      Featured
                    </p>
                    <p className="text-white font-serif text-2xl leading-tight">
                      {activeNav.label}
                    </p>
                  </div>
                  <div className="w-full h-full bg-[#E8E6E1]" />
                </div>

                {/* Link groups */}
                {activeNav.dropdown.groups.map((group, gi) => (
                  <div key={gi}>
                    <p className="text-xs font-medium tracking-[0.15em] uppercase text-[#6B6B6B] mb-4">
                      {group.label}
                    </p>
                    <ul className="space-y-2.5">
                      {group.links.map((sublink) => (
                        <li key={sublink.href}>
                          <Link
                            to={sublink.href}
                            className="text-sm text-[#1A1A1A] hover:text-[#FF3B30] transition-colors inline-flex items-center gap-2"
                          >
                            {sublink.label}
                            {sublink.badge && (
                              <span className="inline-block text-[9px] font-bold tracking-[0.1em] uppercase text-[#FF3B30] border border-[#FF3B30] px-1.5 py-0.5 rounded-full">
                                {sublink.badge}
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
        )}
      </header>

      <MobileMenu
        open={mobileOpen}
        onClose={() => setMobileOpen(false)}
        links={NAV_LINKS.map(l => ({label: l.label, href: l.href}))}
      />

      {/* Inline keyframes for dropdown animations */}
      <style>{`
        @keyframes fadeDown {
          from { opacity: 0; transform: translateY(-8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes slideDown {
          from { opacity: 0; max-height: 0; }
          to { opacity: 1; max-height: 200px; }
        }
      `}</style>
    </>
  );
}

/* ── Icon components ──────────────────────────────────────────────────── */

function SearchIcon() {
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
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  );
}

function UserIcon() {
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
      <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
      <circle cx="12" cy="7" r="4" />
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

function BagIcon() {
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
      <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" />
      <line x1="3" y1="6" x2="21" y2="6" />
      <path d="M16 10a4 4 0 01-8 0" />
    </svg>
  );
}

function HamburgerIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      className="w-5 h-5"
      aria-hidden="true"
    >
      <line x1="3" y1="7" x2="21" y2="7" />
      <line x1="3" y1="12" x2="21" y2="12" />
      <line x1="3" y1="17" x2="21" y2="17" />
    </svg>
  );
}

function ChevronDownIcon({className = ''}: {className?: string}) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <polyline points="6 9 12 15 18 9" />
    </svg>
  );
}

function WishlistCount() {
  const {count} = useWishlist();
  if (count === 0) return null;
  return (
    <span
      className="absolute -top-0.5 -right-0.5 min-w-[14px] h-3.5 flex items-center justify-center bg-[#FF3B30] text-white text-[8px] font-bold rounded-full px-1 leading-none"
      aria-hidden="true"
    >
      {count > 99 ? '99+' : count}
    </span>
  );
}
