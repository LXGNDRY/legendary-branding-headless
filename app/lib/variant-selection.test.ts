import {describe, expect, it} from 'vitest';
import {
  findSelectedVariant,
  initialSelection,
  isOptionValueAvailable,
  isOptionValueInStock,
  selectOptionValue,
} from './variant-selection';

const v = (id: string, color: string, size: string, availableForSale = true) => ({
  id,
  availableForSale,
  selectedOptions: [
    {name: 'Color', value: color},
    {name: 'Size', value: size},
  ],
});

const variants = [v('1', 'Black', 'S'), v('2', 'Black', 'M', false), v('3', 'White', 'M'), v('4', 'White', 'S', false)];

describe('variant-selection', () => {
  it('returns no variant until every option is chosen', () => {
    expect(findSelectedVariant(variants, ['Color', 'Size'], {Color: 'Black'})).toBeNull();
    expect(findSelectedVariant(variants, ['Color', 'Size'], {Color: 'White', Size: 'M'})?.id).toBe('3');
  });

  it('marks sizes unavailable only for the chosen color', () => {
    expect(isOptionValueAvailable(variants, 'Size', 'M', {})).toBe(true);
    expect(isOptionValueAvailable(variants, 'Size', 'M', {Color: 'Black'})).toBe(false);
    expect(isOptionValueAvailable(variants, 'Size', 'S', {Color: 'White'})).toBe(false);
    expect(isOptionValueAvailable(variants, 'Color', 'Black', {Size: 'M'})).toBe(false);
  });

  it('pre-selects single-value options only', () => {
    expect(
      initialSelection([
        {name: 'Title', optionValues: [{name: 'Default Title'}]},
        {name: 'Size', optionValues: [{name: 'S'}, {name: 'M'}]},
      ]),
    ).toEqual({Title: 'Default Title'});
  });

  it('switching to a value incompatible with other choices clears them instead of trapping the customer', () => {
    // Only Black/S and White/M are in stock.
    expect(isOptionValueInStock(variants, 'Color', 'White')).toBe(true);
    expect(selectOptionValue(variants, {Color: 'Black', Size: 'S'}, 'Color', 'White')).toEqual({Color: 'White'});
    expect(selectOptionValue(variants, {Color: 'White'}, 'Size', 'M')).toEqual({Size: 'M', Color: 'White'});
  });
});
