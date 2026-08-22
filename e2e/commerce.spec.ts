import {expect, test} from '@playwright/test';

const PRODUCT_HANDLE =
  process.env.E2E_PRODUCT_HANDLE || 'legendary-world-round-t-shirt';
const PRODUCT_TITLE = /The World-Round T-Shirt/i;
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
  test('selected variant → cart mutation → quantity → checkout → removal', async ({
    page,
    baseURL,
  }) => {
    await page.goto(PRODUCT_PATH, {waitUntil: 'domcontentloaded'});

    await expect(page.getByRole('heading', {name: PRODUCT_TITLE})).toBeVisible();

    const addToCart = page.getByTestId('add-to-cart');
    await expect(addToCart).toBeVisible();
    await expect(addToCart).toBeEnabled();

    const addResponse = page.waitForResponse(isCartMutation);
    await addToCart.click();
    expect((await addResponse).ok()).toBe(true);

    const drawer = page.getByRole('dialog', {name: 'Shopping cart'});
    await expect(drawer).toBeVisible();
    await expect(drawer.getByText(PRODUCT_TITLE)).toBeVisible();
    await expect(drawer.getByText(/Your Bag \(1\)/i)).toBeVisible();

    expectTrustedCheckout(
      await drawer.getByTestId('drawer-checkout').getAttribute('href'),
      baseURL,
    );

    await drawer.getByRole('link', {name: /view full cart/i}).click();
    await expect(page).toHaveURL(/\/cart$/);
    await expect(page.getByText(PRODUCT_TITLE)).toBeVisible();

    const updateResponse = page.waitForResponse(isCartMutation);
    await page.getByRole('button', {name: 'Increase quantity'}).first().click();
    expect((await updateResponse).ok()).toBe(true);
    await expect(page.getByText(/Subtotal \(2 items\)/i)).toBeVisible();

    expectTrustedCheckout(
      await page.getByTestId('cart-checkout').getAttribute('href'),
      baseURL,
    );

    const removeResponse = page.waitForResponse(isCartMutation);
    await page.getByRole('button', {name: 'Remove'}).first().click();
    expect((await removeResponse).ok()).toBe(true);
    await expect(page.getByText(/Your cart is empty/i)).toBeVisible();
  });
});
