import {useEffect, useState, useRef} from 'react';
import {Link, useFetcher} from 'react-router';
import Button from '~/components/ui/Button';
import {CartForm, Image, Money} from '@shopify/hydrogen';
import type {CartData, CartLineData} from '~/lib/cart';
import {useFocusTrap} from '~/hooks/useFocusTrap';

// Free shipping threshold — match your store's free shipping threshold
const FREE_SHIPPING_THRESHOLD = 150;

function CloseIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      aria-hidden="true"
    >
      <path d="M4 4l12 12M16 4L4 16" />
    </svg>
  );
}

function MinusIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" aria-hidden="true">
      <path d="M2 7h10" />
    </svg>
  );
}

function PlusIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" aria-hidden="true">
      <path d="M7 2v10M2 7h10" />
    </svg>
  );
}

function TruckIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M1 5h8v5H1V5z" />
      <path d="M9 7h3l2 2v1H9V7z" />
      <circle cx="3" cy="12" r="1.2" />
      <circle cx="11" cy="12" r="1.2" />
    </svg>
  );
}

function CartLineItem({line}: {line: CartLineData}) {
  const {merchandise, quantity, cost} = line;
  const {product, selectedOptions, image, price} = merchandise;

  const variantLabel = selectedOptions
    .filter((o) => o.value !== 'Default Title')
    .map((o) => o.value)
    .join(' / ');

  return (
    <div className="flex gap-4 py-5 border-b border-[var(--color-border-muted)]">
      {/* Image */}
      <Link
        to={`/products/${product.handle}`}
        className="shrink-0 w-20 h-24 overflow-hidden rounded-md bg-[var(--color-bg-level-2)] block"
      >
        {image ? (
          <Image
            data={image}
            aspectRatio="5/6"
            width={250}
            height={300}
            sizes="80px"
            loading="lazy"
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-[var(--color-bg-level-3)]" />
        )}
      </Link>

      {/* Details */}
      <div className="flex-1 min-w-0 flex flex-col justify-between">
        <div>
          <Link
            to={`/products/${product.handle}`}
            className="text-sm font-medium text-[var(--color-text-primary)] hover:text-[var(--color-accent)] transition-colors h-truncate-2 block leading-snug"
          >
            {product.title}
          </Link>
          {variantLabel && (
            <p className="mt-1 text-[11px] text-[var(--color-text-tertiary)] tracking-wide">{variantLabel}</p>
          )}
          <div className="mt-1.5">
            <Money data={price} className="text-sm font-medium text-[var(--color-text-primary)]" />
          </div>
        </div>

        <div className="flex items-center justify-between mt-3">
          {/* Quantity controls */}
          <div className="flex items-center border border-[var(--color-border-medium)] rounded-md overflow-hidden">
            <CartForm
              route="/cart"
              action={CartForm.ACTIONS.LinesUpdate}
              inputs={{lines: [{id: line.id, quantity: Math.max(0, quantity - 1)}]}}
            >
              <button
                type="submit"
                className="w-7 h-7 flex items-center justify-center text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-bg-level-3)] transition-colors disabled:opacity-30"
                aria-label="Decrease quantity"
                disabled={quantity <= 1}
              >
                <MinusIcon />
              </button>
            </CartForm>
            <span className="w-7 text-center text-xs font-medium text-[var(--color-text-primary)]">{quantity}</span>
            <CartForm
              route="/cart"
              action={CartForm.ACTIONS.LinesUpdate}
              inputs={{lines: [{id: line.id, quantity: quantity + 1}]}}
            >
              <button
                type="submit"
                className="w-7 h-7 flex items-center justify-center text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-bg-level-3)] transition-colors"
                aria-label="Increase quantity"
              >
                <PlusIcon />
              </button>
            </CartForm>
          </div>

          {/* Line total + remove */}
          <div className="flex items-center gap-3">
            <Money data={cost.totalAmount} className="text-sm font-medium text-[var(--color-text-primary)]" />
            <CartForm
              route="/cart"
              action={CartForm.ACTIONS.LinesRemove}
              inputs={{lineIds: [line.id]}}
            >
              <button
                type="submit"
                className="text-[11px] text-[var(--color-text-tertiary)] hover:text-[var(--color-error)] transition-colors"
                aria-label={`Remove ${product.title}`}
              >
                Remove
              </button>
            </CartForm>
          </div>
        </div>
      </div>
    </div>
  );
}

interface CartDrawerProps {
  cart: CartData;
  open: boolean;
  onClose: () => void;
}

export default function CartDrawer({cart, open, onClose}: CartDrawerProps) {
  const lines = cart?.lines?.nodes ?? [];
  const totalQuantity = cart?.totalQuantity ?? 0;
  const subtotal = cart?.cost?.subtotalAmount;
  const subtotalValue = subtotal ? parseFloat(subtotal.amount) : 0;
  // Free shipping progress
  const progress = Math.min((subtotalValue / FREE_SHIPPING_THRESHOLD) * 100, 100);
  const remaining = Math.max(FREE_SHIPPING_THRESHOLD - subtotalValue, 0);
  const hasFreeShipping = remaining <= 0;

  // Discount code state
  const [discountOpen, setDiscountOpen] = useState(false);
  const [discountCode, setDiscountCode] = useState('');
  const fetcher = useFetcher();

  const {containerRef: drawerRef} = useFocusTrap(open, onClose);

  // Close on Escape (handled by useFocusTrap, but keep as safety)
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [open, onClose]);

  // Lock body scroll
  useEffect(() => {
    const original = document.body.style.overflow;
    if (open) {
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.body.style.overflow = original;
    };
  }, [open]);

  function applyDiscount(e: React.FormEvent) {
    e.preventDefault();
    // Discount codes are applied at checkout in Shopify
    setDiscountOpen(false);
    setDiscountCode('');
  }

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 z-[490] bg-black/60 transition-opacity duration-300 ${
          open ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        aria-hidden="true"
        onClick={onClose}
      />

      {/* Drawer */}
      <div
        ref={drawerRef}
        role="dialog"
        aria-modal="true"
        aria-label="Shopping cart"
        aria-hidden={!open}
        className={`fixed inset-y-0 right-0 z-[500] w-full sm:w-[420px] bg-[var(--color-bg-level-1)] flex flex-col shadow-2xl border-l border-[var(--color-border-muted)] transition-transform duration-300 ease-[var(--ease-expo)] ${
          open ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 h-16 border-b border-[var(--color-border-muted)] shrink-0">
          <p className="text-xs font-semibold tracking-[0.15em] uppercase text-[var(--color-text-primary)]">
            Your Bag{totalQuantity > 0 ? ` (${totalQuantity})` : ''}
          </p>
          <button
            onClick={onClose}
            aria-label="Close cart"
            className="p-1.5 text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors rounded-md hover:bg-[var(--color-bg-level-2)]"
          >
            <CloseIcon />
          </button>
        </div>

        {/* Free shipping progress */}
        {lines.length > 0 && subtotal && (
          <div className="px-6 py-4 border-b border-[var(--color-border-muted)] shrink-0 bg-[var(--color-bg-level-0)]">
            <div className="flex items-center gap-2.5 mb-2.5">
              <TruckIcon />
              <span className="text-[11px] tracking-wide text-[var(--color-text-secondary)]">
                {hasFreeShipping ? (
                  <span className="font-medium text-[var(--color-success)]">You qualify for free shipping</span>
                ) : (
                  <>Add <span className="font-medium text-[var(--color-text-primary)]">${remaining.toFixed(2)}</span> for free shipping</>
                )}
              </span>
            </div>
            <div className="h-1 bg-[var(--color-bg-level-3)] rounded-full overflow-hidden">
              <div
                className="h-full bg-[var(--color-accent)] transition-all duration-500 ease-[var(--ease-expo)]"
                style={{width: `${progress}%`}}
                aria-hidden="true"
              />
            </div>
          </div>
        )}

        {/* Cart lines */}
        <div className="flex-1 overflow-y-auto px-6">
          {lines.length === 0 ? (
            <div className="py-20 text-center">
              <p className="text-sm text-[var(--color-text-tertiary)] mb-6">Your bag is empty.</p>
              <Button
                as="link"
                to="/collections/all-products"
                variant="outline"
                size="sm"
                onClick={onClose}
                className="w-full"
              >
                Start Shopping
              </Button>
            </div>
          ) : (
            lines.map((line) => <CartLineItem key={line.id} line={line} />)
          )}
        </div>

        {/* Footer — subtotal + discount + checkout */}
        {lines.length > 0 && cart && (
          <div className="px-6 py-6 border-t border-[var(--color-border-muted)] shrink-0 space-y-4 bg-[var(--color-bg-level-0)]">
            {/* Discount code */}
            {discountOpen ? (
              <form onSubmit={applyDiscount} className="flex gap-2">
                <input
                  type="text"
                  value={discountCode}
                  onChange={(e) => setDiscountCode(e.target.value)}
                  placeholder="Discount code"
                  className="flex-1 text-sm border border-[var(--color-border-medium)] bg-[var(--color-bg-level-2)] px-3 py-2 rounded-md text-[var(--color-text-primary)] placeholder:text-[var(--color-text-tertiary)] focus:outline-none focus:border-[var(--color-accent)]"
                  autoFocus
                />
                <button
                  type="submit"
                  className="text-[11px] font-semibold tracking-widest uppercase bg-[var(--color-bg-level-3)] text-[var(--color-text-primary)] px-4 py-2 rounded-md hover:bg-[var(--color-bg-level-4)] transition-colors"
                >
                  Apply
                </button>
                <button
                  type="button"
                  onClick={() => setDiscountOpen(false)}
                  className="text-[11px] text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)] transition-colors"
                >
                  Cancel
                </button>
              </form>
            ) : (
              <button
                onClick={() => setDiscountOpen(true)}
                className="text-[11px] tracking-wide text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)] underline underline-offset-2 transition-colors"
              >
                + Add discount code
              </button>
            )}

            {/* Subtotal */}
            <div className="flex justify-between items-baseline">
              <span className="text-xs tracking-[0.15em] uppercase text-[var(--color-text-secondary)]">Subtotal</span>
              <Money data={cart.cost.subtotalAmount} className="text-base font-semibold text-[var(--color-text-primary)]" />
            </div>
            <p className="text-[11px] text-[var(--color-text-tertiary)] tracking-wide">
              Taxes and shipping calculated at checkout
            </p>

            {/* Checkout */}
            <Button
              as="a"
              href={cart.checkoutUrl}
              variant="primary"
              className="w-full justify-center"
              size="md"
            >
              Checkout
            </Button>

            <div className="flex justify-center pt-1">
              <Link
                to="/cart"
                onClick={onClose}
                className="text-[11px] tracking-[0.15em] uppercase text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)] transition-colors"
              >
                View Full Cart
              </Link>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
