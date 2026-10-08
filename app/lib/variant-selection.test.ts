import {describe, expect, it} from 'vitest';
import {findSelectedVariant, initialSelection, isOptionValueAvailable} from './variant-selection';

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
});
