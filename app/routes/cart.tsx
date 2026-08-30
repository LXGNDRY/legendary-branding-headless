import type {MetaFunction, LoaderFunctionArgs, ActionFunctionArgs} from 'react-router';
import {useLoaderData, useFetcher, Link} from 'react-router';
import {Analytics, AnalyticsEvent, CartForm, Image, Money, useAnalytics} from '@shopify/hydrogen';
import type {CurrencyCode} from '@shopify/hydrogen/storefront-api-types';
import {useEffect, useState} from 'react';
import Container from '~/components/ui/Container';
import Button from '~/components/ui/Button';
import type {CartData, CartLineData, CartDiscountAllocation} from '~/lib/cart';
import {requireSameOrigin} from '~/lib/security';

export const meta: MetaFunction = () => [
  {title: 'Cart | LEGENDARY BRANDING'},
];

export async function action({request, context}: ActionFunctionArgs) {
  const originError = requireSameOrigin(request);
  if (originError) return originError;
  const {cart} = context;
  const formData = await request.formData();
  const {action, inputs} = CartForm.getFormInput(formData);

  let result;
  switch (action) {
    case CartForm.ACTIONS.LinesAdd:
      result = await cart.addLines(
        inputs.lines as Parameters<typeof cart.addLines>[0],
      );
      break;
    case CartForm.ACTIONS.LinesUpdate:
      result = await cart.updateLines(
        inputs.lines as Parameters<typeof cart.updateLines>[0],
      );
      break;
    case CartForm.ACTIONS.LinesRemove:
      result = await cart.removeLines(
        inputs.lineIds as Parameters<typeof cart.removeLines>[0],
      );
      break;
    case CartForm.ACTIONS.DiscountCodesUpdate:
      result = await cart.updateDiscountCodes(
        (inputs.discountCodes as string[]).map((code) => code.trim()).filter(Boolean),
      );
      break;
    default:
      return new Response('Bad request', {status: 400});
  }

  const headers = cart.setCartId(result.cart.id);
  return Response.json(
    {
      cart: result.cart,
      errors: result.errors ?? [],
      warnings: result.warnings ?? [],
    },
    {status: 200, headers},
  );
}

export async function loader({context}: LoaderFunctionArgs) {
  const {cart} = context;
  return {cart: (await cart.get()) as CartData};
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

function CartLineRow({line}: {line: CartLineData}) {
  const {merchandise, quantity, cost, discountAllocations} = line;
  const {product, selectedOptions, image} = merchandise;

  const variantLabel = selectedOptions
    .filter((o) => o.value !== 'Default Title')
    .map((o) => o.value)
    .join(' / ');

  // Per-unit price reflects any line-scoped discount (e.g. an automatic
  // "25% off" collection discount) — `merchandise.price` does not, since
  // that's the variant's undiscounted list price.
  const unitPrice = cost.amountPerQuantity ?? merchandise.price;
  const compareAtUnitPrice = cost.compareAtAmountPerQuantity;
  const isLineDiscounted =
    compareAtUnitPrice != null &&
    parseFloat(compareAtUnitPrice.amount) > parseFloat(unitPrice.amount);
  const discountLabels = (discountAllocations ?? [])
    .map((d) => d.code ?? d.title)
    .filter((label): label is string => Boolean(label));

  return (
    <div className="flex gap-5 py-6 border-b border-[var(--color-border-subtle)]">
      {/* Image */}
      <Link
        to={`/products/${product.handle}`}
        className="shrink-0 w-24 h-28 overflow-hidden rounded-lg bg-[var(--color-surface)] block"
      >
        {image ? (
          <Image
            data={image}
            aspectRatio="6/7"
            width={300}
            height={350}
            sizes="96px"
            loading="lazy"
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-[var(--color-border-subtle)]" />
        )}
      </Link>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex justify-between gap-4">
          <div className="min-w-0">
            <Link
              to={`/products/${product.handle}`}
              className="text-sm font-medium text-[var(--color-foreground)] hover:text-[var(--color-text-secondary)] transition-colors block leading-snug"
            >
              {product.title}
            </Link>
            {variantLabel && (
              <p className="mt-1 text-xs text-[var(--color-text-secondary)] tracking-wide">{variantLabel}</p>
            )}
            {discountLabels.length > 0 && (
              <p className="mt-1 text-xs text-[var(--color-success)] tracking-wide">
                {discountLabels.join(' · ')}
              </p>
            )}
            <div className="mt-1 flex items-baseline gap-2">
              <Money data={unitPrice} className="text-sm font-medium" />
              {isLineDiscounted && compareAtUnitPrice && (
                <Money
                  data={compareAtUnitPrice}
                  as="s"
                  className="text-xs text-[var(--color-text-secondary)] line-through"
                />
              )}
            </div>
          </div>
          <div className="text-right shrink-0">
            <Money data={cost.totalAmount} className="text-sm font-medium" />
          </div>
        </div>

        {/* Quantity + remove */}
        <div className="flex items-center gap-4 mt-4">
          <div className="flex items-center border border-[var(--color-border-subtle)]">
            <CartForm
              route="/cart"
              action={CartForm.ACTIONS.LinesUpdate}
              inputs={{lines: [{id: line.id, quantity: Math.max(0, quantity - 1)}]}}
            >
              <button
                type="submit"
                className="w-11 h-11 flex items-center justify-center text-[var(--color-foreground)] hover:bg-[var(--color-surface)] transition-colors disabled:opacity-40"
                aria-label={`Decrease quantity for ${product.title}${variantLabel ? `, ${variantLabel}` : ''}`}
                disabled={quantity <= 1}
              >
                <MinusIcon />
              </button>
            </CartForm>
            <span className="w-9 text-center text-sm font-medium">{quantity}</span>
            <CartForm
              route="/cart"
              action={CartForm.ACTIONS.LinesUpdate}
              inputs={{lines: [{id: line.id, quantity: quantity + 1}]}}
            >
              <button
                type="submit"
                className="w-11 h-11 flex items-center justify-center text-[var(--color-foreground)] hover:bg-[var(--color-surface)] transition-colors"
                aria-label={`Increase quantity for ${product.title}${variantLabel ? `, ${variantLabel}` : ''}`}
              >
                <PlusIcon />
              </button>
            </CartForm>
          </div>

          <CartForm
            route="/cart"
            action={CartForm.ACTIONS.LinesRemove}
            inputs={{lineIds: [line.id]}}
          >
            <button
              type="submit"
              className="text-xs text-[var(--color-text-secondary)] underline underline-offset-2 hover:text-[var(--color-foreground)] transition-colors p-2.5 -m-2.5"
              aria-label={`Remove ${product.title}${variantLabel ? `, ${variantLabel}` : ''}`}
            >
              Remove
            </button>
          </CartForm>
        </div>
      </div>
    </div>
  );
}

/** Applied-code / apply-form / discount-amount UI for the Order Summary. */
function CartDiscountSection({cart}: {cart: NonNullable<CartData>}) {
  const [discountOpen, setDiscountOpen] = useState(false);
  const [discountCode, setDiscountCode] = useState('');
  const fetcher = useFetcher<{
    cart?: {
      discountCodes?: {code: string; applicable: boolean}[];
      discountAllocations?: CartDiscountAllocation[];
    };
    errors?: Array<{message?: string}>;
  }>();

  function applyDiscount(e: React.FormEvent) {
    e.preventDefault();
    const code = discountCode.trim();
    if (!code) return;
    fetcher.submit(
      {
        [CartForm.INPUT_NAME]: JSON.stringify({
          action: CartForm.ACTIONS.DiscountCodesUpdate,
          inputs: {discountCodes: [code]},
        }),
      },
      {method: 'post', action: '/cart'},
    );
  }

  const discountResult = fetcher.data?.cart?.discountCodes?.[0];
  const discountError =
    fetcher.data?.errors?.[0]?.message ??
    (discountResult && !discountResult.applicable
      ? 'That discount code is not valid for this cart.'
      : null);

  useEffect(() => {
    if (fetcher.state === 'idle' && discountResult?.applicable) {
      setDiscountOpen(false);
      setDiscountCode('');
    }
  }, [discountResult, fetcher.state]);

  const discountAllocations = cart.discountAllocations ?? [];
  const totalDiscountAmount = discountAllocations.reduce(
    (sum, allocation) => sum + parseFloat(allocation.discountedAmount.amount),
    0,
  );
  const discountCurrencyCode: CurrencyCode =
    discountAllocations[0]?.discountedAmount.currencyCode ??
    cart.cost.subtotalAmount.currencyCode ??
    'USD';

  return (
    <>
      {discountOpen ? (
        <form onSubmit={applyDiscount} className="flex flex-wrap gap-2">
          <input
            type="text"
            value={discountCode}
            onChange={(e) => setDiscountCode(e.target.value)}
            placeholder="Discount code"
            className="flex-1 min-w-0 text-sm border border-[var(--color-border-subtle)] bg-[var(--color-canvas)] px-3 py-2 text-[var(--color-foreground)] placeholder:text-[var(--color-text-secondary)] focus:outline-none focus:border-[var(--color-foreground)]"
            autoFocus
          />
          <div className="flex gap-2 shrink-0">
            <button
              type="submit"
              disabled={fetcher.state !== 'idle'}
              className="text-xs font-semibold tracking-widest uppercase bg-[var(--color-foreground)] text-[var(--color-canvas)] px-4 min-h-11 hover:opacity-90 transition-opacity"
            >
              {fetcher.state !== 'idle' ? 'Applying…' : 'Apply'}
            </button>
            <button
              type="button"
              onClick={() => setDiscountOpen(false)}
              className="text-xs text-[var(--color-text-secondary)] hover:text-[var(--color-foreground)] transition-colors px-2.5 min-h-11"
            >
              Cancel
            </button>
          </div>
        </form>
      ) : (
        <button
          onClick={() => setDiscountOpen(true)}
          className="text-xs tracking-wide text-[var(--color-text-secondary)] hover:text-[var(--color-foreground)] underline underline-offset-2 transition-colors"
        >
          + Add discount code
        </button>
      )}
      {discountError && (
        <p role="alert" className="text-xs text-[var(--color-error)]">
          {discountError}
        </p>
      )}
      {cart.discountCodes?.filter((code) => code.applicable).map((code) => (
        <div key={code.code} className="flex items-center justify-between text-xs text-[var(--color-success)]">
          <span>Discount applied: {code.code}</span>
          <CartForm
            route="/cart"
            action={CartForm.ACTIONS.DiscountCodesUpdate}
            inputs={{discountCodes: []}}
          >
            <button type="submit" className="underline underline-offset-2">Remove</button>
          </CartForm>
        </div>
      ))}
      {totalDiscountAmount > 0 && (
        <div className="flex justify-between text-sm">
          <span className="text-[var(--color-text-secondary)] tracking-widest uppercase text-xs">
            {discountAllocations.length === 1
              ? discountAllocations[0].code
                ? `Discount (${discountAllocations[0].code})`
                : (discountAllocations[0].title ?? 'Discount')
              : 'Discount'}
          </span>
          <Money
            data={{
              amount: (-totalDiscountAmount).toFixed(2),
              currencyCode: discountCurrencyCode,
            }}
            className="font-medium text-[var(--color-success)]"
          />
        </div>
      )}
    </>
  );
}

export default function CartPage() {
  const {cart} = useLoaderData<typeof loader>();
  const {publish} = useAnalytics();
  const lines = cart?.lines?.edges?.map(({node}) => node) ?? [];
  const isEmpty = lines.length === 0;
  const [checkingOut, setCheckingOut] = useState(false);

  return (
    <>
    <Analytics.CartView />
    <Container className="py-16">
      <h1 className="text-3xl font-bold tracking-tight mb-10">Your Cart</h1>

      {isEmpty ? (
        <div className="py-24 text-center border-y border-[var(--color-border-subtle)]">
          <p className="text-sm text-[var(--color-text-secondary)] tracking-wide mb-6">
            Your cart is empty.
          </p>
          <Button as="link" to="/collections/all-products" variant="outline">
            Continue Shopping
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          {/* Cart lines */}
          <div className="lg:col-span-2">
            {lines.map((line) => (
              <CartLineRow key={line.id} line={line} />
            ))}
            <div className="pt-6">
              <Link
                to="/collections/all-products"
                className="text-xs tracking-widest uppercase underline underline-offset-2 text-[var(--color-text-secondary)] hover:text-[var(--color-foreground)] transition-colors"
              >
                Continue Shopping
              </Link>
            </div>
          </div>

          {/* Order summary */}
          <div className="bg-[var(--color-surface)] p-8 h-fit">
            <h2 className="text-xs font-semibold tracking-widest uppercase mb-6">
              Order Summary
            </h2>
            <div className="space-y-3 mb-6">
              <div className="flex justify-between text-sm">
                <span className="text-[var(--color-text-secondary)] tracking-widest uppercase text-xs">
                  Subtotal ({cart?.totalQuantity} {cart?.totalQuantity === 1 ? 'item' : 'items'})
                </span>
                {cart?.cost.subtotalAmount && (
                  <Money data={cart.cost.subtotalAmount} className="font-medium" />
                )}
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-[var(--color-text-secondary)] tracking-widest uppercase text-xs">Shipping</span>
                <span className="text-[var(--color-text-secondary)]">Calculated at checkout</span>
              </div>
              {cart && <CartDiscountSection cart={cart} />}
            </div>
            <div className="border-t border-[var(--color-border-subtle)] pt-4 mb-8">
              <div className="flex justify-between font-medium text-sm">
                <span className="tracking-widest uppercase text-xs">Estimated Total</span>
                {cart?.cost.totalAmount && (
                  <Money data={cart.cost.totalAmount} />
                )}
              </div>
            </div>

            {cart?.checkoutUrl ? (
              <div
                onClick={() => {
                  if (checkingOut) return;
                  setCheckingOut(true);
                  publish(AnalyticsEvent.CUSTOM_EVENT, {eventName: 'begin_checkout', cart});
                }}
                className={checkingOut ? 'pointer-events-none' : undefined}
              >
                <Button
                  as="a"
                  href={cart.checkoutUrl}
                  variant="dark"
                  className="w-full justify-center"
                  loading={checkingOut}
                  testId="cart-checkout"
                >
                  {checkingOut ? 'Redirecting…' : 'Proceed to Checkout'}
                </Button>
              </div>
            ) : (
              <Button
                variant="dark"
                type="button"
                className="w-full justify-center"
                disabled
                ariaLabel="Checkout unavailable -- your cart is still loading"
              >
                Proceed to Checkout
              </Button>
            )}

            <p className="mt-4 text-center text-[11px] text-[var(--color-text-secondary)] tracking-wide">
              Taxes and shipping calculated at checkout
            </p>
          </div>
        </div>
      )}
    </Container>
    </>
  );
}
