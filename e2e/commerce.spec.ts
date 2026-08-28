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
    expect(addedCartResponse.headers()['x-cart-quantity']).toBe('1');

    const cartButton = page
      .getByRole('banner')
      .getByRole('button', {name: 'Cart (1 items)'});
    await expect(cartButton).toBeVisible();
    await cartButton.click();

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

    const updateResponse = page.waitForResponse(isCartMutation);
    await page.getByRole('button', {name: 'Increase quantity'}).first().click();
    const updatedCartResponse = await updateResponse;
    expect(updatedCartResponse.ok()).toBe(true);
    expect(updatedCartResponse.headers()['x-cart-quantity']).toBe('2');
    await expect(page.getByText(/Subtotal \(2 items\)/i)).toBeVisible();

    expectTrustedCheckout(
      await page.getByTestId('cart-checkout').getAttribute('href'),
      baseURL,
    );

    const removeResponse = page.waitForResponse(isCartMutation);
    await page.getByRole('button', {name: 'Remove'}).first().click();
    const removedCartResponse = await removeResponse;
    expect(removedCartResponse.ok()).toBe(true);
    expect(removedCartResponse.headers()['x-cart-quantity']).toBe('0');
  });
});
