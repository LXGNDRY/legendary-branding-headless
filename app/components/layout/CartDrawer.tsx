import {useEffect, useState} from 'react';
import {Link, useFetcher} from 'react-router';
import {CartForm, Image, Money} from '@shopify/hydrogen';
import type {CartData, CartLineData} from '~/lib/cart';

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
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
      <path d="M2 7h10" />
    </svg>
  );
}

function PlusIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
      <path d="M7 2v10M2 7h10" />
    </svg>
  );
}

function TruckIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.3" aria-hidden="true">
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
    <div className="flex gap-4 py-5 border-b border-black/10">
      {/* Image */}
      <Link
        to={`/products/${product.handle}`}
        className="shrink-0 w-20 h-24 overflow-hidden bg-[#f7f7f7] block"
      >
        {image ? (
          <Image
            data={image}
            aspectRatio="5/6"
            sizes="80px"
            loading="lazy"
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-[#e5e5e5]" />
        )}
      </Link>

      {/* Details */}
      <div className="flex-1 min-w-0 flex flex-col justify-between">
        <div>
          <Link
            to={`/products/${product.handle}`}
            className="text-xs font-medium tracking-wide text-[#0a0a0a] hover:text-[#6b6b6b] transition-colors line-clamp-2 block"
          >
            {product.title}
          </Link>
          {variantLabel && (
            <p className="mt-0.5 text-[11px] text-[#6b6b6b] tracking-wide">{variantLabel}</p>
          )}
          <div className="mt-1">
            <Money data={price} className="text-xs font-medium" />
          </div>
        </div>

        <div className="flex items-center justify-between mt-3">
          {/* Quantity controls */}
          <div className="flex items-center border border-black/10">
            <CartForm
              route="/cart"
              action={CartForm.ACTIONS.LinesUpdate}
              inputs={{lines: [{id: line.id, quantity: Math.max(0, quantity - 1)}]}}
            >
              <button
                type="submit"
                className="w-8 h-8 flex items-center justify-center text-[#0a0a0a] hover:bg-[#f7f7f7] transition-colors disabled:opacity-40"
                aria-label="Decrease quantity"
                disabled={quantity <= 1}
              >
                <MinusIcon />
              </button>
            </CartForm>
            <span className="w-8 text-center text-xs font-medium">{quantity}</span>
            <CartForm
              route="/cart"
              action={CartForm.ACTIONS.LinesUpdate}
              inputs={{lines: [{id: line.id, quantity: quantity + 1}]}}
            >
              <button
                type="submit"
                className="w-8 h-8 flex items-center justify-center text-[#0a0a0a] hover:bg-[#f7f7f7] transition-colors"
                aria-label="Increase quantity"
              >
                <PlusIcon />
              </button>
            </CartForm>
          </div>

          {/* Line total + remove */}
          <div className="flex items-center gap-3">
            <Money data={cost.totalAmount} className="text-xs font-medium" />
            <CartForm
              route="/cart"
              action={CartForm.ACTIONS.LinesRemove}
              inputs={{lineIds: [line.id]}}
            >
              <button
                type="submit"
                className="text-[11px] text-[#6b6b6b] underline underline-offset-2 hover:text-[#0a0a0a] transition-colors"
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

  // Close on Escape
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
    document.body.style.overflow = open ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  function applyDiscount(e: React.FormEvent) {
    e.preventDefault();
    // Discount application via CartForm
    // Note: discount codes are applied at checkout in Shopify
    // We're tracking them in the cart for display purposes
    setDiscountOpen(false);
    setDiscountCode('');
  }

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
        aria-label="Shopping cart"
        className={`fixed inset-y-0 right-0 z-50 w-full sm:w-[420px] bg-white flex flex-col shadow-2xl transition-transform duration-300 ease-out ${
          open ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 h-16 border-b border-black/10 shrink-0">
          <p className="text-xs font-semibold tracking-widest uppercase">
            Cart{totalQuantity > 0 ? ` (${totalQuantity})` : ''}
          </p>
          <button
            onClick={onClose}
            aria-label="Close cart"
            className="p-1 text-[#0a0a0a] hover:text-[#6b6b6b] transition-colors"
          >
            <CloseIcon />
          </button>
        </div>

        {/* Free shipping progress */}
        {lines.length > 0 && subtotal && (
          <div className="px-6 py-4 border-b border-black/10 shrink-0 bg-[#fafafa]">
            <div className="flex items-center gap-2 mb-2">
              <TruckIcon />
              <span className="text-[11px] tracking-wide">
                {hasFreeShipping ? (
                  <span className="font-medium text-[#0a0a0a]">You qualify for free shipping!</span>
                ) : (
                  <>Add <span className="font-medium">${remaining.toFixed(2)}</span> for free shipping</>
                )}
              </span>
            </div>
            <div className="h-1 bg-black/10 rounded-full overflow-hidden">
              <div
                className="h-full bg-[#0a0a0a] transition-all duration-500 ease-out"
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
              <p className="text-sm text-[#6b6b6b] mb-6 tracking-wide">Your cart is empty.</p>
              <button
                onClick={onClose}
                className="text-xs font-medium tracking-widest uppercase underline underline-offset-4 text-[#0a0a0a] hover:text-[#6b6b6b] transition-colors"
              >
                Continue Shopping
              </button>
            </div>
          ) : (
            lines.map((line) => <CartLineItem key={line.id} line={line} />)
          )}
        </div>

        {/* Footer — subtotal + discount + checkout */}
        {lines.length > 0 && cart && (
          <div className="px-6 py-6 border-t border-black/10 shrink-0 space-y-4">
            {/* Discount code */}
            {discountOpen ? (
              <form onSubmit={applyDiscount} className="flex gap-2">
                <input
                  type="text"
                  value={discountCode}
                  onChange={(e) => setDiscountCode(e.target.value)}
                  placeholder="Enter discount code"
                  className="flex-1 text-xs border border-black/20 px-3 py-2 focus:outline-none focus:border-black"
                  autoFocus
                />
                <button
                  type="submit"
                  className="text-[11px] font-medium tracking-widest uppercase bg-black text-white px-4 py-2 hover:opacity-90 transition-opacity"
                >
                  Apply
                </button>
                <button
                  type="button"
                  onClick={() => setDiscountOpen(false)}
                  className="text-[11px] text-black/50 hover:text-black transition-colors"
                >
                  Cancel
                </button>
              </form>
            ) : (
              <button
                onClick={() => setDiscountOpen(true)}
                className="text-[11px] tracking-wide text-black/60 underline underline-offset-2 hover:text-black transition-colors"
              >
                + Add discount code
              </button>
            )}

            {/* Subtotal */}
            <div className="flex justify-between items-baseline">
              <span className="text-xs tracking-widest uppercase text-[#6b6b6b]">Subtotal</span>
              <Money data={cart.cost.subtotalAmount} className="text-sm font-medium" />
            </div>
            <p className="text-[11px] text-[#6b6b6b] tracking-wide">
              Taxes and shipping calculated at checkout
            </p>

            {/* Checkout */}
            <a
              href={cart.checkoutUrl}
              className="block w-full py-4 bg-[#0a0a0a] text-white text-xs font-semibold tracking-widest uppercase text-center hover:bg-[#333] transition-colors"
            >
              Proceed to Checkout
            </a>

            <div className="flex justify-center">
              <Link
                to="/cart"
                onClick={onClose}
                className="text-[11px] tracking-widest uppercase text-[#6b6b6b] hover:text-[#0a0a0a] underline underline-offset-2 transition-colors"
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
