import type {MetaFunction} from 'react-router';
import Container from '~/components/ui/Container';
import Button from '~/components/ui/Button';
import Placeholder from '~/components/ui/Placeholder';

export const meta: MetaFunction = () => [
  {title: 'Cart — LEGENDARY BRANDING'},
];

export async function loader() {
  return {};
}

export default function CartPage() {
  return (
    <Container className="py-16">
      <h1 className="text-3xl font-bold tracking-tight mb-10">Your Cart</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        {/* Cart lines */}
        <div className="lg:col-span-2 space-y-0">
          {/* Empty state */}
          <div className="py-20 text-center border-y border-[#e5e5e5]">
            <p className="text-sm text-[#6b6b6b] tracking-wide mb-6">
              Your cart is empty.
            </p>
            <Button as="link" to="/collections/all-products" variant="outline">
              Continue Shopping
            </Button>
          </div>

          {/* Line item skeleton (shown when populated — wired in Milestone 4) */}
          <div className="hidden">
            <div className="flex gap-4 py-6 border-b border-[#e5e5e5]">
              <Placeholder aspect="aspect-square" label="Product" className="w-24 shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="h-3 bg-[#e5e5e5] rounded-sm w-1/2 animate-pulse" />
                <div className="h-3 bg-[#e5e5e5] rounded-sm w-1/4 animate-pulse" />
              </div>
            </div>
          </div>
        </div>

        {/* Order summary */}
        <div className="bg-[#f7f7f7] p-8">
          <h2 className="text-xs font-semibold tracking-widest uppercase mb-6">
            Order Summary
          </h2>
          <div className="space-y-3 mb-6">
            <div className="flex justify-between text-sm">
              <span className="text-[#6b6b6b]">Subtotal</span>
              <span>—</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-[#6b6b6b]">Shipping</span>
              <span className="text-[#6b6b6b]">Calculated at checkout</span>
            </div>
          </div>
          <div className="border-t border-[#e5e5e5] pt-4 mb-8">
            <div className="flex justify-between font-medium">
              <span>Total</span>
              <span>—</span>
            </div>
          </div>

          {/* Checkout redirect — wired in Milestone 4 */}
          <Button variant="primary" type="button" className="w-full py-4 text-sm" disabled>
            Proceed to Checkout
          </Button>

          <p className="mt-4 text-center text-[11px] text-[#6b6b6b] tracking-wide">
            Cart + checkout wired in Milestone 4.
          </p>
        </div>
      </div>
    </Container>
  );
}
