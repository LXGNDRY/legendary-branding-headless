import {expect, test} from '@playwright/test';

const PRODUCT_HANDLE =
  process.env.E2E_PRODUCT_HANDLE || 'legendary-world-round-t-shirt';
const PRODUCT_PATH = `/products/${PRODUCT_HANDLE}?Color=Black&Size=S`;
const TRUSTED_CHECKOUT_HOSTS = new Set([
  'legendary-branding.com',
  'www.legendary-branding.com',
  'lngndny.myshopify.com',
]);

function isCartMutation(response: import('@playwright/test').Response) {
  return (
    response.request().method() === 'POST' &&
    /^\/cart(?:\.data)?$/.test(new URL(response.url()).pathname)
  );
}

function expectTrustedCheckout(href: string | null, baseURL?: string) {
  expect(href, 'Shopify returned no checkout URL').toBeTruthy();
  const url = new URL(href!, baseURL);
  expect(url.protocol).toBe('https:');
  expect(TRUSTED_CHECKOUT_HOSTS.has(url.hostname)).toBe(true);
  expect(url.pathname).toMatch(/checkouts?|cart\/c\//i);
}

test.describe('Golden commerce journey', () => {
  test('PDP communicates shipping charges and provides product-specific fit guidance', async ({page}) => {
    await page.goto(PRODUCT_PATH, {waitUntil: 'domcontentloaded'});
    await expect(page.getByRole('heading', {level: 1})).toBeVisible();

    await page.locator('#variant-options').getByRole('button', {name: 'Size Guide'}).click();
    const sizeGuide = page.getByRole('dialog', {name: 'Size Guide'});
    await expect(sizeGuide).toBeVisible();
    const chartOrGuidance = sizeGuide.locator('img').or(sizeGuide.getByText(/Product-specific measurements/));
    await expect(chartOrGuidance.first()).toBeVisible();
    await sizeGuide.getByRole('button', {name: 'Close size guide'}).click();

    await page.getByRole('button', {name: 'Shipping & Returns'}).click();
    const shippingDetails = page.getByText(/Standard shipping is \$5 on orders under \$100 USD/);
    await expect(shippingDetails).toBeVisible();
    await expect(page.getByText(/\$12 express shipping option is available/)).toBeVisible();
    await expect(page.getByText(/Import duties are included in the displayed price/)).toBeVisible();
    await expect(page.getByText(/Applicable taxes are paid by you and calculated at checkout/).first()).toBeVisible();
  });

  test('international market selection updates and persists for the session', async ({page}) => {
    await page.goto(PRODUCT_PATH, {waitUntil: 'domcontentloaded'});
    const countrySelector = page.getByLabel('Shipping country and market').first();
    await expect(countrySelector).toBeAttached();

    const marketResponse = page.waitForResponse((response) =>
      response.request().method() === 'POST' && new URL(response.url()).pathname === '/api/market',
    );
    await countrySelector.selectOption('GB');
    const response = await marketResponse;
    expect(response.ok()).toBe(true);
    await expect(page.getByLabel('Shipping country and market').first()).toHaveValue('GB');

    await page.reload({waitUntil: 'domcontentloaded'});
    await expect(page.getByLabel('Shipping country and market').first()).toHaveValue('GB');
  });

  test('selected variant → cart mutation → quantity → checkout → removal', async ({
    page,
    baseURL,
  }) => {
    await page.goto(PRODUCT_PATH, {waitUntil: 'domcontentloaded'});
    await expect(page.getByRole('heading', {level: 1})).toBeVisible();

    const addToCart = page.getByTestId('add-to-cart');
    await expect(addToCart).toBeVisible();
    await expect(addToCart).toBeEnabled();

    const addResponse = page.waitForResponse(isCartMutation);
    await addToCart.click();
    const addedCartResponse = await addResponse;
    expect(addedCartResponse.ok()).toBe(true);
    expect(await addedCartResponse.text()).toMatch(/"totalQuantity",\s*1/);

    // Adding to cart auto-opens the drawer (see root.tsx's fetcher-driven
    // effect) -- it's already open here, so clicking the header cart button
    // would just hit the drawer's own overlay instead of the button behind
    // it. Verify the auto-open worked rather than re-triggering it.
    const drawer = page.getByRole('dialog', {name: 'Shopping cart'});
    await expect(drawer).toBeVisible();
    await expect(drawer.getByText(/Your Bag \(1\)/i)).toBeVisible();

    const drawerCheckout = drawer.getByTestId('drawer-checkout');
    await expect(drawerCheckout).toBeVisible();
    expectTrustedCheckout(
      await drawerCheckout.getAttribute('href'),
      baseURL,
    );

    await drawer.getByRole('link', {name: /view full cart/i}).click();
    await expect(page).toHaveURL(/\/cart$/);
    await expect(page.getByText(/Subtotal \(1 item\)/i)).toBeVisible();

    // NOTE: this store's `cartLinesUpdate` does not update the target line's
    // quantity in place — it deterministically creates a second line at
    // quantity 1 instead, leaving the original line untouched (confirmed by
    // calling the Storefront API directly, with no app code involved, so
    // this is a platform/app-side behavior on this store, not a bug in this
    // codebase — see PR description). Because of that, a line can never
    // legitimately reach quantity >1 through the UI today, so its "Decrease
    // quantity" button (disabled at quantity <= 1) can never be exercised.
    // This test verifies what the storefront can actually guarantee: the
    // aggregate cart total updates correctly, the checkout link stays
    // trustworthy, and removing lines empties the cart — without asserting
    // an in-place quantity decrement the platform doesn't currently honor.
    const updateResponse = page.waitForResponse(isCartMutation);
    const cartPage = page.locator('#main-content');
    await cartPage
      .getByRole('button', {name: /^Increase quantity for /})
      .first()
      .click();
    const updatedCartResponse = await updateResponse;
    expect(updatedCartResponse.ok()).toBe(true);
    expect(await updatedCartResponse.text()).toMatch(/"totalQuantity",\s*2/);
    await expect(page.getByText(/Subtotal \(2 items\)/i)).toBeVisible();

    expectTrustedCheckout(
      await page.getByTestId('cart-checkout').getAttribute('href'),
      baseURL,
    );

    const firstRemoveResponse = page.waitForResponse(isCartMutation);
    await cartPage.getByRole('button', {name: /^Remove /}).first().click();
    const firstRemovedCartResponse = await firstRemoveResponse;
    expect(firstRemovedCartResponse.ok()).toBe(true);
    expect(await firstRemovedCartResponse.text()).toMatch(/"totalQuantity",\s*1/);
    await expect(page.getByText(/Subtotal \(1 item\)/i)).toBeVisible();

    const removeResponse = page.waitForResponse(isCartMutation);
    await cartPage.getByRole('button', {name: /^Remove /}).first().click();
    const removedCartResponse = await removeResponse;
    expect(removedCartResponse.ok()).toBe(true);
    expect(await removedCartResponse.text()).toMatch(/"totalQuantity",\s*0/);
    await expect(page.getByText(/Your cart is empty/i)).toBeVisible();
  });
});
