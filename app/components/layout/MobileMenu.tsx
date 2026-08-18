import {Link} from 'react-router';
import {useEffect} from 'react';
import {useFocusTrap} from '~/hooks/useFocusTrap';

/**
 * HANSSEN x LEGENDARY — Mobile Menu
 *
 * Full-screen overlay menu with large serif links stacked vertically.
 * Slides down from top when open.
 * Includes focus trap for accessibility — Tab stays inside the menu.
 */

interface MobileMenuProps {
  open: boolean;
  onClose: () => void;
  links: {label: string; href: string}[];
}

export default function MobileMenu({open, onClose, links}: MobileMenuProps) {
  const {containerRef} = useFocusTrap(open, onClose);

  // Lock body scroll when menu is open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  if (!open) return null;

  const secondaryLinks = [
    {label: 'Account', href: '/account/login'},
    {label: 'Wishlist', href: '/wishlist'},
    {label: 'Contact', href: '/policies/contact'},
    {label: 'Shipping & Returns', href: '/policies/shipping-policy'},
  ];

  return (
    <div className="fixed inset-0 z-[200] md:hidden" role="dialog" aria-modal="true" aria-label="Mobile menu">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-[var(--color-background)] animate-[fadeIn_0.2s_ease-out]"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Content */}
      <div
        ref={containerRef}
        className="relative h-full flex flex-col px-[clamp(1.25rem,5vw,2.5rem)] pt-16 pb-10 overflow-y-auto"
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-[clamp(1.25rem,5vw,2.5rem)] p-1 text-[var(--color-foreground)]"
          aria-label="Close menu"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>

        {/* Logo */}
        <Link
          to="/"
          onClick={onClose}
          className="text-xl font-serif tracking-tight text-[var(--color-foreground)] mb-12"
        >
          LEGENDARY
        </Link>

        {/* Primary nav — big serif */}
        <nav className="flex-1" aria-label="Mobile navigation">
          <ul className="space-y-2">
            {links.map((link, i) => (
              <li
                key={link.href}
                className="animate-[slideUp_0.4s_ease-out_both]"
                style={{animationDelay: `${i * 50}ms`}}
              >
                <Link
                  to={link.href}
                  onClick={onClose}
                  className="font-serif text-4xl leading-tight text-[var(--color-foreground)] hover:text-[var(--color-accent)] transition-colors block py-2"
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        {/* Divider */}
        <div className="h-px bg-[var(--color-border-subtle)] my-8" />

        {/* Secondary links */}
        <ul className="space-y-3 mb-8">
          {secondaryLinks.map((link) => (
            <li key={link.href}>
              <Link
                to={link.href}
                onClick={onClose}
                className="text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-foreground)] transition-colors"
              >
                {link.label}
              </Link>
            </li>
          ))}
        </ul>

        {/* Socials */}
        <div className="flex items-center gap-4">
          <a href="#" className="text-[var(--color-text-secondary)] hover:text-[var(--color-foreground)] transition-colors" aria-label="Instagram">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
              <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
              <path d="M16 11.37A4 4 0 1112.63 8 4 4 0 0116 11.37z" />
              <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
            </svg>
          </a>
          <a href="#" className="text-[var(--color-text-secondary)] hover:text-[var(--color-foreground)] transition-colors" aria-label="TikTok">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
              <path d="M9 12a4 4 0 104 4V4a5 5 0 005 5" />
            </svg>
          </a>
          <a href="#" className="text-[var(--color-text-secondary)] hover:text-[var(--color-foreground)] transition-colors" aria-label="YouTube">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
              <path d="M22.54 6.42a2.78 2.78 0 00-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 00-1.94 2A29 29 0 001 11.75a29 29 0 00.46 5.33A2.78 2.78 0 003.4 19c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 001.94-2 29 29 0 00.46-5.25 29 29 0 00-.46-5.33z" />
              <polygon points="9.75 15.02 15.5 11.75 9.75 8.48 9.75 15.02" />
            </svg>
          </a>
        </div>
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
