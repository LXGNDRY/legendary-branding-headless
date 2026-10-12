import type {LoaderFunctionArgs} from 'react-router';
import {redirect} from 'react-router';
import {parsePermalinkDiscount, parsePermalinkLines} from '~/lib/cart-permalink';
import {withCheckoutLocale} from '~/lib/cart';

export async function loader({params, request, context}: LoaderFunctionArgs) {
  const lines = parsePermalinkLines(params.lines);
  if (!lines) throw new Response('Invalid cart link', {status: 400});

  const discount = parsePermalinkDiscount(new URL(request.url).searchParams.get('discount'));
  const result = await context.cart.create({
    lines,
    ...(discount && {discountCodes: [discount]}),
  });

  const cart = result.cart;
  if (result.errors?.length || !cart?.checkoutUrl) {
    throw new Response('This cart link is no longer valid', {status: 410});
  }

  const headers = context.cart.setCartId(cart.id);
  return redirect(withCheckoutLocale(cart.checkoutUrl), {status: 303, headers});
}
