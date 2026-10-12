import type {Page} from '@playwright/test';

const MAX_PRODUCTS_TO_TRY = 8;
const MAX_OPTION_STEPS = 6;

/** The option names ("Color", "Size") in a list of `Name: Value` link labels, minus those already chosen. */
export function nextOptionLabel(labels: string[], chosenOptionNames: Set<string>): string | undefined {
  return labels.find((label) => !chosenOptionNames.has(label.split(':')[0].trim()));
}

async function catalogProductPaths(page: Page) {
  await page.goto('/collections/all-products', {waitUntil: 'domcontentloaded'});
  const links = page.locator('a[href^="/products/"]');
  await links.first().waitFor({state: 'attached'});
  const hrefs = await links.evaluateAll((elements) => elements.map((element) => element.getAttribute('href') ?? ''));
  return [...new Set(hrefs.map((href) => href.split('?')[0]))].slice(0, MAX_PRODUCTS_TO_TRY);
}

/** Chooses the first available value of each option until the add-to-cart button appears (it only renders for an in-stock selected variant). */
async function selectFirstAvailableOptions(page: Page) {
  const addToCart = page.getByTestId('add-to-cart');
  for (let step = 0; step < MAX_OPTION_STEPS; step += 1) {
    await addToCart.waitFor({state: 'visible', timeout: 1500}).catch(() => undefined);
    if (await addToCart.isVisible()) return true;

    const chosen = new Set(new URL(page.url()).searchParams.keys());
    const labels = await page
      .locator('#variant-options a[aria-label]')
      .evaluateAll((elements) => elements.map((element) => element.getAttribute('aria-label') ?? ''));
    const next = nextOptionLabel(labels, chosen);
    if (!next) return false;

    const optionName = next.split(':')[0].trim();
    await page.locator('#variant-options').getByRole('link', {name: next, exact: true}).click();
    await page.waitForURL((url) => url.searchParams.has(optionName));
  }
  return false;
}

/**
 * Finds a product that can be bought right now, at run time, so the commerce
 * tests do not depend on one fixed product staying published and in stock.
 * It must have a Size option (the size-guide test needs one) and an available
 * variant. Returns the product path with the chosen options in its query string.
 */
export async function findPurchasableProductPath(page: Page): Promise<string> {
  for (const path of await catalogProductPaths(page)) {
    await page.goto(path, {waitUntil: 'domcontentloaded'});
    await page.getByRole('heading', {level: 1}).waitFor();
    const hasSizeGuide = await page
      .locator('#variant-options')
      .getByRole('button', {name: 'Size Guide'})
      .isVisible()
      .catch(() => false);
    if (!hasSizeGuide) continue;
    if (await selectFirstAvailableOptions(page)) {
      const url = new URL(page.url());
      return `${url.pathname}${url.search}`;
    }
  }
  throw new Error(`No purchasable product with a Size option found among the first ${MAX_PRODUCTS_TO_TRY} catalog products`);
}
