/**
 * LEGENDARY BRANDING — Trust Strip
 *
 * Four-item reassurance row shown below the Add to Cart button on PDP,
 * ported from the live Liquid theme's `sections/lb-product-page.liquid`
 * trust strip (Free Returns / Premium Fabric / Free Shipping / Secure
 * Checkout), each with a label and sub-label plus an inline icon.
 */

interface TrustItem {
  label: string;
  sub: string;
  icon: React.ReactNode;
}

const ITEMS: TrustItem[] = [
  {
    label: 'Free Returns',
    sub: '30-day hassle-free',
    icon: (
      <polyline points="20 6 9 17 4 12" />
    ),
  },
  {
    label: 'Premium Fabric',
    sub: 'Heavyweight quality',
    icon: (
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    ),
  },
  {
    label: 'Free Shipping',
    sub: 'On orders over $100',
    icon: (
      <>
        <rect x="1" y="3" width="15" height="13" rx="1" />
        <path d="M16 8h4l3 4v4h-7V8z" />
        <circle cx="5.5" cy="18.5" r="2.5" />
        <circle cx="18.5" cy="18.5" r="2.5" />
      </>
    ),
  },
  {
    label: 'Secure Checkout',
    sub: 'SSL encrypted',
    icon: (
      <>
        <rect x="3" y="11" width="18" height="11" rx="2" />
        <path d="M7 11V7a5 5 0 0 1 10 0v4" />
      </>
    ),
  },
];

export default function TrustStrip() {
  return (
    <ul
      role="list"
      aria-label="Trust signals"
      className="grid grid-cols-2 gap-4 border-t border-[var(--color-border-muted)] pt-5 sm:grid-cols-4"
    >
      {ITEMS.map((item) => (
        <li key={item.label} className="flex flex-col items-start gap-1.5">
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            aria-hidden="true"
            className="text-[var(--color-text-secondary)]"
          >
            {item.icon}
          </svg>
          <span className="text-[0.7rem] font-semibold uppercase tracking-[0.08em] text-[var(--color-text-primary)]">
            {item.label}
          </span>
          <span className="text-[0.7rem] leading-tight text-[var(--color-text-tertiary)]">
            {item.sub}
          </span>
        </li>
      ))}
    </ul>
  );
}
