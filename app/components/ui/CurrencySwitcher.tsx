import {useState} from 'react';
import {useNavigate} from 'react-router';

interface CurrencyOption {
  code: string;
  symbol: string;
  label: string;
}

const CURRENCIES: CurrencyOption[] = [
  {code: 'USD', symbol: '$', label: 'US Dollar'},
  {code: 'EUR', symbol: '€', label: 'Euro'},
  {code: 'GBP', symbol: '£', label: 'British Pound'},
  {code: 'CAD', symbol: 'CA$', label: 'Canadian Dollar'},
  {code: 'AUD', symbol: 'AU$', label: 'Australian Dollar'},
  {code: 'JPY', symbol: '¥', label: 'Japanese Yen'},
];

interface CurrencySwitcherProps {
  currentCurrency?: string;
  className?: string;
}

/**
 * Currency switcher component.
 *
 * Note: Currency conversion is handled by Shopify's Storefront API
 * via the @inContext directive. The i18n country/currency is set in
 * createHydrogenContext and can be overridden per-request via URL params
 * or session.
 *
 * This component updates the currency in the session — the actual
 * price conversion happens server-side via the Storefront API.
 */
export default function CurrencySwitcher({
  currentCurrency = 'USD',
  className = '',
}: CurrencySwitcherProps) {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  const current = CURRENCIES.find((c) => c.code === currentCurrency) ?? CURRENCIES[0];

  function handleSelect(code: string) {
    setOpen(false);
    // Currency change triggers a page reload with the new currency context
    // In a full implementation, this would update the i18n session and redirect
    navigate('?currency=' + code);
  }

  return (
    <div className={`relative ${className}`}>
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1 text-[11px] tracking-widest uppercase hover:text-black/60 transition-colors"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={`Currency: ${current.label}`}
      >
        <span>{current.symbol}</span>
        <span className="hidden sm:inline">{current.code}</span>
        <svg
          width="10"
          height="10"
          viewBox="0 0 10 10"
          className={open ? 'rotate-180 transition-transform' : 'transition-transform'}
          aria-hidden="true"
        >
          <path d="M2 4l3 3 3-3" fill="none" stroke="currentColor" strokeWidth="1.3" />
        </svg>
      </button>

      {open && (
        <>
          {/* Backdrop to close on outside click */}
          <div
            className="fixed inset-0 z-10"
            onClick={() => setOpen(false)}
            aria-hidden="true"
          />
          {/* Dropdown */}
          <ul
            role="listbox"
            className="absolute right-0 top-full mt-2 min-w-[160px] bg-white border border-black/10 shadow-lg z-20"
          >
            {CURRENCIES.map((currency) => (
              <li key={currency.code}>
                <button
                  role="option"
                  aria-selected={currency.code === currentCurrency}
                  onClick={() => handleSelect(currency.code)}
                  className={`w-full text-left px-4 py-2.5 text-xs tracking-wide hover:bg-[#f7f7f7] transition-colors flex items-center justify-between ${
                    currency.code === currentCurrency ? 'font-medium bg-[#fafafa]' : ''
                  }`}
                >
                  <span>{currency.label}</span>
                  <span className="text-black/50">{currency.symbol}</span>
                </button>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}
