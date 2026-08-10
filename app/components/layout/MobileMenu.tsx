import {Link} from 'react-router';
import {useEffect} from 'react';

interface NavLink {
  label: string;
  href: string;
}

interface MobileMenuProps {
  open: boolean;
  onClose: () => void;
  links: NavLink[];
}

export default function MobileMenu({open, onClose, links}: MobileMenuProps) {
  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [open, onClose]);

  // Prevent body scroll when open
  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 z-40 bg-black/40 transition-opacity duration-300 ${
          open ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        aria-hidden="true"
        onClick={onClose}
      />

      {/* Drawer */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Navigation menu"
        className={`fixed inset-y-0 left-0 z-50 w-80 max-w-full bg-white flex flex-col transition-transform duration-300 ease-out ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 h-16 border-b border-[#e5e5e5]">
          <Link
            to="/"
            onClick={onClose}
            className="text-sm font-bold tracking-[0.2em] uppercase"
          >
            LEGENDARY
          </Link>
          <button
            onClick={onClose}
            aria-label="Close menu"
            className="p-1 text-[#0a0a0a] hover:text-[#6b6b6b] transition-colors"
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 20 20"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
            >
              <path d="M4 4l12 12M16 4L4 16" />
            </svg>
          </button>
        </div>

        {/* Nav links */}
        <nav className="flex-1 overflow-y-auto py-8">
          <ul className="space-y-0">
            {links.map(({label, href}) => (
              <li key={href}>
                <Link
                  to={href}
                  onClick={onClose}
                  className="block px-6 py-4 text-sm font-medium tracking-[0.15em] uppercase text-[#0a0a0a] hover:bg-[#f7f7f7] transition-colors border-b border-[#e5e5e5]"
                >
                  {label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        {/* Footer links */}
        <div className="px-6 py-6 border-t border-[#e5e5e5] space-y-3">
          <Link
            to="/policies/about"
            onClick={onClose}
            className="block text-xs tracking-widest uppercase text-[#6b6b6b] hover:text-[#0a0a0a] transition-colors"
          >
            About
          </Link>
          <Link
            to="/policies/contact"
            onClick={onClose}
            className="block text-xs tracking-widest uppercase text-[#6b6b6b] hover:text-[#0a0a0a] transition-colors"
          >
            Contact
          </Link>
          <Link
            to="/search"
            onClick={onClose}
            className="block text-xs tracking-widest uppercase text-[#6b6b6b] hover:text-[#0a0a0a] transition-colors"
          >
            Search
          </Link>
        </div>
      </div>
    </>
  );
}
