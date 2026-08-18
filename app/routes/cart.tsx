import type {MetaFunction, LoaderFunctionArgs, ActionFunctionArgs} from 'react-router';
import {useLoaderData, Link} from 'react-router';
import {CartForm, Image, Money} from '@shopify/hydrogen';
import Container from '~/components/ui/Container';
import Button from '~/components/ui/Button';
import type {CartData, CartLineData} from '~/lib/cart';

export const meta: MetaFunction = () => [
  {title: 'Cart — LEGENDARY BRANDING'},
];

export async function action({request, context}: ActionFunctionArgs) {
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
    default:
      return new Response('Bad request', {status: 400});
  }

  const headers = cart.setCartId(result.cart.id);
  return new Response(null, {status: 200, headers});
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
  const {merchandise, quantity, cost} = line;
  const {product, selectedOptions, image, price} = merchandise;

  const variantLabel = selectedOptions
    .filter((o) => o.value !== 'Default Title')
    .map((o) => o.value)
    .join(' / ');

  return (
    <div className="flex gap-5 py-6 border-b border-[#e5e5e5]">
      {/* Image */}
      <Link
        to={`/products/${product.handle}`}
        className="shrink-0 w-24 h-28 overflow-hidden rounded-lg bg-[#f7f7f7] block"
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
          <div className="w-full h-full bg-[#e5e5e5]" />
        )}
      </Link>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex justify-between gap-4">
          <div className="min-w-0">
            <Link
              to={`/products/${product.handle}`}
              className="text-sm font-medium text-[#0a0a0a] hover:text-[#6b6b6b] transition-colors block leading-snug"
            >
              {product.title}
            </Link>
            {variantLabel && (
              <p className="mt-1 text-xs text-[#6b6b6b] tracking-wide">{variantLabel}</p>
            )}
            <div className="mt-1">
              <Money data={price} className="text-sm font-medium" />
            </div>
          </div>
          <div className="text-right shrink-0">
            <Money data={cost.totalAmount} className="text-sm font-medium" />
          </div>
        </div>

        {/* Quantity + remove */}
        <div className="flex items-center gap-4 mt-4">
          <div className="flex items-center border border-[#e5e5e5]">
            <CartForm
              route="/cart"
              action={CartForm.ACTIONS.LinesUpdate}
              inputs={{lines: [{id: line.id, quantity: Math.max(0, quantity - 1)}]}}
            >
              <button
                type="submit"
                className="w-9 h-9 flex items-center justify-center text-[#0a0a0a] hover:bg-[#f7f7f7] transition-colors disabled:opacity-40"
                aria-label="Decrease quantity"
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
                className="w-9 h-9 flex items-center justify-center text-[#0a0a0a] hover:bg-[#f7f7f7] transition-colors"
                aria-label="Increase quantity"
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
              className="text-xs text-[#6b6b6b] underline underline-offset-2 hover:text-[#0a0a0a] transition-colors"
            >
              Remove
            </button>
          </CartForm>
        </div>
      </div>
    </div>
  );
}

export default function CartPage() {
  const {cart} = useLoaderData<typeof loader>();
  const lines = cart?.lines?.nodes ?? [];
  const isEmpty = lines.length === 0;

  return (
    <Container className="py-16">
      <h1 className="text-3xl font-bold tracking-tight mb-10">Your Cart</h1>

      {isEmpty ? (
        <div className="py-24 text-center border-y border-[#e5e5e5]">
          <p className="text-sm text-[#6b6b6b] tracking-wide mb-6">
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
                className="text-xs tracking-widest uppercase underline underline-offset-2 text-[#6b6b6b] hover:text-[#0a0a0a] transition-colors"
              >
                Continue Shopping
              </Link>
            </div>
          </div>

          {/* Order summary */}
          <div className="bg-[#f7f7f7] p-8 h-fit">
            <h2 className="text-xs font-semibold tracking-widest uppercase mb-6">
              Order Summary
            </h2>
            <div className="space-y-3 mb-6">
              <div className="flex justify-between text-sm">
                <span className="text-[#6b6b6b]">
                  Subtotal ({cart?.totalQuantity} {cart?.totalQuantity === 1 ? 'item' : 'items'})
                </span>
                {cart?.cost.subtotalAmount && (
                  <Money data={cart.cost.subtotalAmount} className="font-medium" />
                )}
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-[#6b6b6b]">Shipping</span>
                <span className="text-[#6b6b6b]">Calculated at checkout</span>
              </div>
            </div>
            <div className="border-t border-[#e5e5e5] pt-4 mb-8">
              <div className="flex justify-between font-medium text-sm">
                <span>Estimated Total</span>
                {cart?.cost.totalAmount && (
                  <Money data={cart.cost.totalAmount} />
                )}
              </div>
            </div>

            {cart?.checkoutUrl ? (
              <a
                href={cart.checkoutUrl}
                className="block w-full py-4 bg-[#0a0a0a] text-white text-xs font-semibold tracking-widest uppercase text-center hover:bg-[#333] transition-colors"
              >
                Proceed to Checkout
              </a>
            ) : (
              <Button
                variant="solid"
                type="button"
                className="w-full py-4 text-sm"
                disabled
              >
                Proceed to Checkout
              </Button>
            )}

            <p className="mt-4 text-center text-[11px] text-[#6b6b6b] tracking-wide">
              Taxes and shipping calculated at checkout
            </p>
          </div>
        </div>
      )}
    </Container>
  );
}
