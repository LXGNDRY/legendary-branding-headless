import {describe, expect, it} from 'vitest';
import {translate} from './i18n';

describe('translate', () => {
  it('uses Shopify language codes and preserves interpolation', () => {
    expect(translate('ID', 'cart.removeProduct', {product: 'Hoodie'})).toBe('Hapus Hoodie');
  });

  it('falls back to English for a language without a headless UI catalog', () => {
    expect(translate('JA', 'action.addToBag')).toBe('Add to bag');
  });
});
