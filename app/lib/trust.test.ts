import {describe, expect, it} from 'vitest';
import {afterEach, vi} from 'vitest';
import {parseReturnWindowDays, paymentMethodLabels, STORE_POLICY_TITLES_QUERY, STORE_TRUST_QUERY, toStoreTrust, withBudget} from './trust';

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
      refundPolicyTitle: null,
      shippingPolicyTitle: null,
      paymentMethods: [],
      logoUrl: null,
      returnCountries: [],
    });
  });

  it('takes policy link titles from the separate active-language lookup, not the English trust query', () => {
    const trust = toStoreTrust(
      {shop: {refundPolicy: {body: 'You have 30 days to request a return.', url: 'https://x/refund'}}},
      ['US'],
      {shop: {refundPolicy: {title: 'Politique de remboursement'}, shippingPolicy: {title: "Politique d'expédition"}}},
    );
    expect(trust.refundPolicyTitle).toBe('Politique de remboursement');
    expect(trust.shippingPolicyTitle).toBe("Politique d'expédition");
    expect(trust.returnDays).toBe(30);
    expect(STORE_TRUST_QUERY).not.toMatch(/title/);
    expect(STORE_POLICY_TITLES_QUERY).toMatch(/\$language: LanguageCode/);
  });

  it('prefers the published refund and shipping Pages over the built-in policies', () => {
    const trust = toStoreTrust(
      {
        shop: {refundPolicy: {body: 'You have 14 days to request a return.'}},
        refundPage: {body: 'You have 30 days from the date of delivery to request a return.'},
      },
      [],
      {
        shop: {refundPolicy: {title: 'Refund policy'}, shippingPolicy: {title: 'Shipping policy'}},
        refundPage: {title: 'Return & Refund Policy', body: '<p>x</p>'},
        shippingPage: {title: 'Worldwide Shipping', body: '<p>x</p>'},
      },
    );
    expect(trust.returnDays).toBe(30);
    expect(trust.refundPolicyTitle).toBe('Return & Refund Policy');
    expect(trust.shippingPolicyTitle).toBe('Worldwide Shipping');
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

  it('recognises concise "30-day returns" wording', () => {
    expect(parseReturnWindowDays('Our 30-day return policy applies to unworn items.')).toBe(30);
    expect(parseReturnWindowDays('Enjoy 30 day returns on every order.')).toBe(30);
    expect(parseReturnWindowDays('Return shipping: 5-day return shipping labels are emailed.')).toBeNull();
    expect(parseReturnWindowDays('We email 5-day return-labels.')).toBeNull();
    expect(parseReturnWindowDays('Orders ship in 2 days, and we offer 30-day returns.')).toBe(30);
    expect(parseReturnWindowDays('We offer 30-day returns, except sale items have 14 days.')).toBeNull();
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
