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

/** Whether any in-stock variant has this value, regardless of other choices. */
export function isOptionValueInStock(variants: SelectableVariant[], optionName: string, value: string): boolean {
  return variants.some(
    (variant) =>
      variant.availableForSale &&
      variant.selectedOptions.some((option) => option.name === optionName && option.value === value),
  );
}

/**
 * Applies a choice and drops any other choice it can't be combined with in
 * stock, so picking White after Black/S (where only White/M exists) lands on
 * White with size cleared instead of leaving the customer stuck.
 */
export function selectOptionValue(
  variants: SelectableVariant[],
  selection: OptionSelection,
  optionName: string,
  value: string,
): OptionSelection {
  const next: OptionSelection = {[optionName]: value};
  for (const [name, current] of Object.entries(selection)) {
    if (name === optionName) continue;
    if (isOptionValueAvailable(variants, name, current, next)) next[name] = current;
  }
  return next;
}

/** Pre-selects options that only have one value (e.g. "Title: Default Title"), so the customer is only asked real questions. */
export function initialSelection(options: Array<{name: string; optionValues: Array<{name: string}>}>): OptionSelection {
  const selection: OptionSelection = {};
  for (const option of options) {
    if (option.optionValues.length === 1) selection[option.name] = option.optionValues[0].name;
  }
  return selection;
}
