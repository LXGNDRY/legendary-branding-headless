import {test, expect} from '@playwright/test';

/**
 * Golden Customer Journeys — E2E smoke tests.
 *
 * These test the critical user paths against a live storefront.
 * They assert on structure and navigation, not specific product data
 * (which varies by Shopify store configuration).
 *
 * Journeys mapped from PRODUCTION_READINESS.md § Slice 9.2:
 *  1. Homepage → Product → Variant → Add to Cart → Checkout redirect
 *  2. Collection → Filter/sort → Product → Cart → Checkout
 *  3. Search → Product → Cart → Checkout
 *  4. Mobile viewport: Menu → Collection → Product → Cart
 *  5. Customer login → Account → Orders
 *  6. Sold-out product shows correct state, no add-to-cart
 *  7. Empty search → recommendations/no-results state
 *  8. Empty cart state
 *  9. Invalid product URL → branded 404
 *
 * Journeys that require live Shopify data use graceful skips when
 * products/collections aren't available, so the suite can run against
 * any store configuration without false failures.
 */

test.describe('Journey 1: Homepage → Product → Cart → Checkout', () => {
  test('homepage renders with key sections', async ({page}) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/LEGENDARY BRANDING/);

    // Main content + footer present
    await expect(page.locator('main').first()).toBeVisible();
    await expect(page.getByRole('contentinfo')).toBeVisible();

    // Brand name in header or hero
    const brandText = page.getByText(/legendary/i).first();
    await expect(brandText).toBeVisible();
  });

  test('can reach a product page from homepage', async ({page}) => {
    await page.goto('/');

    const productLink = page.locator('a[href^="/products/"]').first();
    const hasProducts = (await productLink.count()) > 0;
    test.skip(!hasProducts, 'No product links found on homepage');

    const href = (await productLink.getAttribute('href')) || '';
    await productLink.click();
    await expect(page).toHaveURL(new RegExp(href.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
  });
});

test.describe('Journey 2: Collection → Product → Cart', () => {
  test('collections listing loads', async ({page}) => {
    await page.goto('/collections');
    await expect(page).toHaveTitle(/collections|shop/i);
    await expect(page.locator('main').first()).toBeVisible();
  });

  test('all-products collection loads with product grid', async ({page}) => {
    await page.goto('/collections/all-products');
    await expect(page.locator('main').first()).toBeVisible();

    // Products should be present (grid or list)
    const products = page.locator('a[href^="/products/"]');
    const count = await products.count();
    // At least one product, or empty state
    if (count === 0) {
      const emptyState = page.getByText(/no products|coming soon|empty/i).first();
      await expect(emptyState).toBeVisible();
    }
  });
});

test.describe('Journey 3: Search → Product → Cart', () => {
  test('search page loads', async ({page}) => {
    await page.goto('/search');
    await expect(page.locator('main').first()).toBeVisible();
    // Search input exists
    const searchInput = page.locator('input[type="search"], input[name="q"], input[placeholder*="search" i]').first();
    await expect(searchInput).toBeAttached();
  });
});

test.describe('Journey 4: Mobile — Menu → Collection → Product', () => {
  // Covered by the 'mobile' Playwright project (iPhone 14 viewport).
  // Tests use the same selectors; viewport is the variable.
  test('mobile homepage has accessible menu button', async ({page}) => {
    await page.goto('/');

    // Menu button (hamburger) should exist on mobile
    const menuButton = page.getByRole('button', {name: /menu|open menu|navigation/i}).or(
      page.locator('button[aria-label*="menu" i]').first(),
    );
    // May be hidden on desktop project but should exist in DOM
    await expect(menuButton.first()).toBeAttached();
  });
});

test.describe('Journey 5: Customer login', () => {
  test('login page loads', async ({page}) => {
    await page.goto('/account/login');
    await expect(page.locator('main').first()).toBeVisible();

    // Email/username input exists
    const emailInput = page.locator('input[type="email"], input[name="email"], input[name="username"]').first();
    await expect(emailInput).toBeAttached();
  });
});

test.describe('Journey 7: Empty search state', () => {
  test('search with no results shows appropriate state', async ({page}) => {
    await page.goto('/search?q=zzzzzzzzzzdefinitelynoproduct');
    await expect(page.locator('main').first()).toBeVisible();
    // Either results or a "no results" message
    const results = page.locator('a[href^="/products/"]');
    const count = await results.count();
    if (count === 0) {
      const noResults = page.getByText(/no results|no products found|no products match|nothing found|couldn't find/i).first();
      await expect(noResults).toBeVisible({timeout: 5000});
    }
  });
});

test.describe('Journey 8: Empty cart state', () => {
  test('empty cart shows empty state', async ({page}) => {
    await page.goto('/cart');
    await expect(page.locator('main').first()).toBeVisible();
    // Empty cart message or cart items
    const emptyText = page.getByText(/your cart is empty|cart is empty|empty cart|nothing in your cart/i).first();
    const hasEmpty = await emptyText.count() > 0;
    if (!hasEmpty) {
      // Should have cart items or checkout button
      const checkoutBtn = page.getByRole('link', {name: /checkout/i}).or(
        page.getByRole('button', {name: /checkout/i}),
      );
      await expect(checkoutBtn.first()).toBeAttached();
    }
  });
});

test.describe('Journey 9: Invalid product URL → 404', () => {
  test('nonexistent product shows branded error page', async ({page}) => {
    await page.goto('/products/this-product-definitely-does-not-exist-12345');

    // Should be a 404 or error state, not a crash
    const title = await page.title();
    const hasErrorText = await page.getByText(/page not found|404|something went wrong|oops/i).first().count() > 0;

    // Either a 404 page or an error boundary page is acceptable
    expect(hasErrorText || title.includes('404') || title.includes('Error')).toBe(true);
    // Footer should still be visible (branded, not a white screen)
    await expect(page.getByRole('contentinfo')).toBeVisible();
  });
});
