import {expect, test, type Page} from '@playwright/test';
import {findPurchasableProductPath} from './helpers/purchasable-product';

// NOTE: chosen at run time from the live catalog, not a fixed handle, so unpublishing or selling out one product cannot break the suite. Memoized per worker.
let purchasablePath: Promise<string> | undefined;
function productPath(page: Page) {
  purchasablePath ??= findPurchasableProductPath(page);
  return purchasablePath;
}
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
    await page.goto(await productPath(page), {waitUntil: 'networkidle'});
    await expect(page.getByRole('heading', {level: 1})).toBeVisible();

    await page.locator('#variant-options').getByRole('button', {name: 'Size Guide'}).click();
    const sizeGuide = page.getByRole('dialog', {name: 'Size Guide'});
    await expect(sizeGuide).toBeVisible();
    const chartOrGuidance = sizeGuide.locator('img').or(sizeGuide.getByText(/Product-specific measurements/));
    await expect(chartOrGuidance.first()).toBeVisible();
    await sizeGuide.getByRole('button', {name: 'Close size guide'}).click();

    await page.getByRole('button', {name: 'Shipping & Returns'}).click();
    // Dollar amounts/thresholds intentionally live only on the shipping
    // policy page (single source of truth, see products.$handle.tsx) --
    // the PDP accordion links out to it rather than duplicating the figures.
    await expect(page.getByText(/Shipping, duties and taxes are calculated at checkout/).first()).toBeVisible();
    // No unconditional shipping or duties guarantees until the owner approves structured facts.
    await expect(page.getByText(/free (standard )?shipping on every order|duties (are )?included/i)).toHaveCount(0);
    await expect(page.getByRole('link', {name: 'shipping policy'})).toBeVisible();
  });

  test('international market selection updates and persists for the session', async ({page}) => {
    await page.goto(await productPath(page), {waitUntil: 'networkidle'});
    const countrySelector = page.getByLabel('Shipping country and market').first();
    await expect(countrySelector).toBeAttached();

    // A successful market update deliberately reloads the document so all
    // server-rendered Storefront API requests use the selected market. Arm
    // both waits before changing the select: calling page.reload() afterward
    // races that application reload on mobile WebKit/Chromium.
    const [response] = await Promise.all([
      page.waitForResponse((response) =>
        response.request().method() === 'POST' && /\/api\/market(?:\.data)?$/.test(new URL(response.url()).pathname),
      ),
      page.waitForNavigation({waitUntil: 'domcontentloaded'}),
      countrySelector.selectOption('GB'),
    ]);
    expect(response.ok()).toBe(true);
    await expect(page.getByLabel('Shipping country and market').first()).toHaveValue('GB');
  });

  test('selected variant → cart mutation → quantity → checkout → removal', async ({
    page,
    baseURL,
  }) => {
    await page.goto(await productPath(page), {waitUntil: 'domcontentloaded'});
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

    // NOTE: depending on the product, `cartLinesUpdate` either raises the
    // line to quantity 2 or adds a second line at quantity 1 (the product this
    // test used to hard-code did the latter), so the number of removals below
    // is not fixed. The test asserts what holds either way: the aggregate
    // total updates, the checkout link stays trustworthy, and removing lines
    // empties the cart.
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

    // Checkout handoff: follow the link as a shopper's browser would (GET only -- no form is submitted, so no order,
    // payment or customer data is created) and require it to load over https without a server error.
    // NOTE: Shopify may answer automated clients with a bot-protection status; that is recorded as an explicit
    // annotation instead of being silently treated as a pass.
    const handoffHref = (await page.getByTestId('cart-checkout').getAttribute('href')) as string;
    const handoff = await page.request.get(new URL(handoffHref, baseURL).toString(), {maxRedirects: 5});
    if ([403, 429, 430].includes(handoff.status())) {
      test.info().annotations.push({type: 'checkout-handoff-unverified', description: `bot protection returned ${handoff.status()}`});
    } else {
      expect(handoff.status(), 'checkout handoff returned an error status').toBeLessThan(400);
      // NOTE: Shopify may redirect to its own checkout hosts, so only the transport is asserted after the redirect.
      expect(new URL(handoff.url()).protocol).toBe('https:');
    }

    let remaining = 2;
    for (let removals = 0; remaining > 0 && removals < 3; removals += 1) {
      const removeResponse = page.waitForResponse(isCartMutation);
      await cartPage.getByRole('button', {name: /^Remove /}).first().click();
      const removedCartResponse = await removeResponse;
      expect(removedCartResponse.ok()).toBe(true);
      const totalQuantity = (await removedCartResponse.text()).match(/"totalQuantity",\s*(\d+)/);
      expect(totalQuantity, 'cart response carried no totalQuantity').toBeTruthy();
      const next = Number(totalQuantity![1]);
      expect(next).toBeLessThan(remaining);
      remaining = next;
    }
    expect(remaining).toBe(0);
    await expect(page.getByText(/Your cart is empty/i)).toBeVisible();
  });
});
