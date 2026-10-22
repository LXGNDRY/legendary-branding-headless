import {CartForm, type HydrogenCart} from '@shopify/hydrogen';
import {requireSameOrigin} from '~/lib/security';

type CartMutationResult = Awaited<ReturnType<HydrogenCart['addLines']>>;

export type CartAction =
  | typeof CartForm.ACTIONS.LinesAdd
  | typeof CartForm.ACTIONS.LinesUpdate
  | typeof CartForm.ACTIONS.LinesRemove
  | typeof CartForm.ACTIONS.DiscountCodesUpdate;

const MAX_LINES = 50;
const MAX_QUANTITY = 99;
const MAX_DISCOUNT_CODES = 5;
const MAX_CODE_LENGTH = 64;
const MAX_ID_LENGTH = 256;

type CartInputs = ReturnType<typeof CartForm.getFormInput>['inputs'];

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isId(value: unknown): value is string {
  return typeof value === 'string' && value.length > 0 && value.length <= MAX_ID_LENGTH;
}

function isQuantity(value: unknown, min: number): value is number {
  return Number.isInteger(value) && (value as number) >= min && (value as number) <= MAX_QUANTITY;
}

function failure(message: string, status: number) {
  return Response.json({cart: null, errors: [{message}], warnings: []}, {status});
}

type Validated<T> = {ok: true; value: T} | {ok: false};

function validateAddLines(lines: unknown): Validated<Parameters<HydrogenCart['addLines']>[0]> {
  if (!Array.isArray(lines) || lines.length === 0 || lines.length > MAX_LINES) return {ok: false};
  const clean: Parameters<HydrogenCart['addLines']>[0] = [];
  for (const line of lines) {
    if (!isRecord(line) || !isId(line.merchandiseId) || !isQuantity(line.quantity ?? 1, 1)) return {ok: false};
    clean.push({merchandiseId: line.merchandiseId, quantity: (line.quantity as number | undefined) ?? 1});
  }
  return {ok: true, value: clean};
}

function validateUpdateLines(lines: unknown): Validated<Parameters<HydrogenCart['updateLines']>[0]> {
  if (!Array.isArray(lines) || lines.length === 0 || lines.length > MAX_LINES) return {ok: false};
  const clean: Parameters<HydrogenCart['updateLines']>[0] = [];
  for (const line of lines) {
    if (!isRecord(line) || !isId(line.id) || !isQuantity(line.quantity, 0)) return {ok: false};
    clean.push({id: line.id, quantity: line.quantity as number});
  }
  return {ok: true, value: clean};
}

function validateLineIds(ids: unknown): Validated<string[]> {
  if (!Array.isArray(ids) || ids.length === 0 || ids.length > MAX_LINES || !ids.every(isId)) return {ok: false};
  return {ok: true, value: ids as string[]};
}

function validateDiscountCodes(codes: unknown): Validated<string[]> {
  if (!Array.isArray(codes) || codes.length > MAX_DISCOUNT_CODES) return {ok: false};
  const clean: string[] = [];
  for (const code of codes) {
    if (typeof code !== 'string') return {ok: false};
    const trimmed = code.trim();
    if (trimmed.length > MAX_CODE_LENGTH) return {ok: false};
    if (trimmed) clean.push(trimmed);
  }
  return {ok: true, value: clean};
}

/**
 * Shared cart mutation endpoint: every failure path returns the same JSON
 * shape the UI already reads (`cart`, `errors`, `warnings`) and the cart
 * cookie is only set for a cart Shopify actually returned.
 */
export async function handleCartMutation({
  request,
  cart,
  allowed,
}: {
  request: Request;
  cart: HydrogenCart;
  allowed: readonly CartAction[];
}): Promise<Response> {
  const originError = requireSameOrigin(request);
  if (originError) return originError;

  let action: string;
  let inputs: CartInputs;
  try {
    const parsed = CartForm.getFormInput(await request.formData());
    action = parsed.action;
    inputs = parsed.inputs;
  } catch {
    return failure('Invalid cart request.', 400);
  }

  if (!allowed.includes(action as CartAction)) return failure('Unsupported cart action.', 400);

  let result: CartMutationResult;
  try {
    switch (action as CartAction) {
      case CartForm.ACTIONS.LinesAdd: {
        const v = validateAddLines(inputs.lines);
        if (!v.ok) return failure('Invalid cart lines.', 400);
        result = await cart.addLines(v.value);
        break;
      }
      case CartForm.ACTIONS.LinesUpdate: {
        const v = validateUpdateLines(inputs.lines);
        if (!v.ok) return failure('Invalid cart lines.', 400);
        result = await cart.updateLines(v.value);
        break;
      }
      case CartForm.ACTIONS.LinesRemove: {
        const v = validateLineIds(inputs.lineIds);
        if (!v.ok) return failure('Invalid cart lines.', 400);
        result = await cart.removeLines(v.value);
        break;
      }
      case CartForm.ACTIONS.DiscountCodesUpdate: {
        const v = validateDiscountCodes(inputs.discountCodes);
        if (!v.ok) return failure('Invalid discount code.', 400);
        result = await cart.updateDiscountCodes(v.value);
        break;
      }
    }
  } catch {
    return failure('We could not update your cart. Please try again.', 502);
  }

  const errors = result?.errors ?? [];
  if (!result?.cart?.id) {
    return Response.json(
      {
        cart: null,
        errors: errors.length ? errors : [{message: 'Your cart is unavailable. Please refresh and try again.'}],
        warnings: result?.warnings ?? [],
      },
      {status: 422},
    );
  }

  return Response.json(
    {cart: result.cart, errors, warnings: result?.warnings ?? []},
    {status: 200, headers: cart.setCartId(result.cart.id)},
  );
}
