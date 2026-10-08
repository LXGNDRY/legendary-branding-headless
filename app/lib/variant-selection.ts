export interface SelectableVariant {
  id: string;
  availableForSale: boolean;
  selectedOptions: Array<{name: string; value: string}>;
}

export type OptionSelection = Record<string, string>;

/** The variant matching every option in `selection`, or null while any option is unchosen. */
export function findSelectedVariant<V extends SelectableVariant>(
  variants: V[],
  optionNames: string[],
  selection: OptionSelection,
): V | null {
  if (optionNames.some((name) => !selection[name])) return null;
  return (
    variants.find((variant) =>
      variant.selectedOptions.every((option) => selection[option.name] === option.value),
    ) ?? null
  );
}

/**
 * Whether choosing `value` for `optionName` can still lead to an in-stock
 * variant, given the customer's other current choices -- the same
 * availability rule the PDP's selector applies, so a sold-out size is
 * disabled for the chosen color rather than across the whole product.
 */
export function isOptionValueAvailable(
  variants: SelectableVariant[],
  optionName: string,
  value: string,
  selection: OptionSelection,
): boolean {
  return variants.some(
    (variant) =>
      variant.availableForSale &&
      variant.selectedOptions.every((option) =>
        option.name === optionName
          ? option.value === value
          : !selection[option.name] || selection[option.name] === option.value,
      ),
  );
}

/** Pre-selects options that only have one value (e.g. "Title: Default Title"), so the customer is only asked real questions. */
export function initialSelection(options: Array<{name: string; optionValues: Array<{name: string}>}>): OptionSelection {
  const selection: OptionSelection = {};
  for (const option of options) {
    if (option.optionValues.length === 1) selection[option.name] = option.optionValues[0].name;
  }
  return selection;
}
