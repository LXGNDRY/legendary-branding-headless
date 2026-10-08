import {describe, expect, it} from 'vitest';
import {parseReturnWindowDays, paymentMethodLabels, toStoreTrust} from './trust';

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
});
