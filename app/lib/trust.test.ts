import {describe, expect, it} from 'vitest';
import {afterEach, vi} from 'vitest';
import {parseReturnWindowDays, paymentMethodLabels, toStoreTrust, withBudget} from './trust';

describe('trust', () => {
  it('reads the return window from the refund policy text', () => {
    const body =
      '<p>We process orders within 2 business days.</p><h2>Return Window</h2><p>You have 30 days from the date of delivery to request a return.</p>';
    expect(parseReturnWindowDays(body)).toBe(30);
  });

  it('returns null when no window is stated', () => {
    expect(parseReturnWindowDays('All sales are final.')).toBeNull();
    expect(parseReturnWindowDays(null)).toBeNull();
  });

  it('labels card brands and wallets once each', () => {
    expect(paymentMethodLabels(['VISA', 'MASTERCARD', 'UNKNOWN'], ['SHOPIFY_PAY', 'APPLE_PAY'])).toEqual([
      'Visa',
      'Mastercard',
      'Shop Pay',
      'Apple Pay',
    ]);
  });

  it('degrades to empty facts on a missing shop', () => {
    expect(toStoreTrust(null)).toEqual({
      returnDays: null,
      refundPolicyUrl: null,
      paymentMethods: [],
      logoUrl: null,
      returnCountries: [],
    });
  });

  it('ignores other durations in the policy', () => {
    const real =
      'Return Window You have 30 days from the date of delivery to request a return. If approved, your refund will be issued to your original payment method within 5–7 business days. Damaged item? Email us within 30 days of delivery.';
    expect(parseReturnWindowDays(real)).toBe(30);
    expect(
      parseReturnWindowDays('Return shipping takes 5 days. You have 30 days from delivery to request a return.'),
    ).toBe(30);
    expect(parseReturnWindowDays('Refunds arrive within 5 business days.')).toBeNull();
  });

  it('recognises direct "days to return" wording', () => {
    expect(parseReturnWindowDays('You have 30 days to return your item.')).toBe(30);
    expect(parseReturnWindowDays('Items must be returned within 14 days of delivery.')).toBe(14);
  });

  it('keeps HTML blocks separate even without end punctuation', () => {
    expect(
      parseReturnWindowDays('<p>Returns are accepted within 30 days</p><p>Return shipping takes 5 days</p>'),
    ).toBe(30);
    expect(parseReturnWindowDays('<h2>Return Window</h2><p>You have 30 days to return it</p><p>Refunds take 5 days</p>')).toBe(30);
  });

  it('omits the claim when the policy gives conflicting windows', () => {
    expect(parseReturnWindowDays('Returns are accepted within 30 days. Returns are accepted within 60 days for members.')).toBeNull();
  });
});

describe('withBudget', () => {
  afterEach(() => vi.useRealTimers());

  it('returns the value when the lookup is fast', async () => {
    await expect(withBudget(Promise.resolve('ok'), 700)).resolves.toBe('ok');
  });

  it('returns null on rejection', async () => {
    await expect(withBudget(Promise.reject(new Error('boom')), 700)).resolves.toBeNull();
  });

  it('gives up after the budget without waiting for a slow lookup', async () => {
    vi.useFakeTimers();
    const slow = new Promise<string>((resolve) => setTimeout(() => resolve('late'), 5_000));
    const result = withBudget(slow, 700);
    await vi.advanceTimersByTimeAsync(700);
    await expect(result).resolves.toBeNull();
  });
});
