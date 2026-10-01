import {test, expect} from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

/**
 * Automated accessibility audit — WCAG AA, per CLAUDE.md's design-system
 * requirement ("all interactive elements must have aria-label or visible
 * label; color contrast must meet WCAG AA minimum"). Runs axe-core against
 * the golden-journey routes (the ones real customers actually land on).
 *
 * `.withTags(...)` already restricts the audit to WCAG 2.0/2.1 A+AA
 * conformance rules, so every violation axe returns here is a normative
 * WCAG AA failure, not an opinionated best-practice -- impact severity
 * (serious/critical/moderate/minor) measures how badly a given violation
 * affects users, not whether the underlying rule is actually required.
 * Filtering by impact would let real, in-scope WCAG AA violations pass
 * silently and unreported, so every one of them fails the suite.
 */

async function auditPage(page: import('@playwright/test').Page, path: string) {
  await page.goto(path, {waitUntil: 'domcontentloaded'});
  const results = await new AxeBuilder({page})
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
    .analyze();

  if (results.violations.length > 0) {
    const detail = results.violations
      .map((v) => `- [${v.impact}] ${v.id}: ${v.help} (${v.nodes.length} node(s))`)
      .join('\n');
    expect(results.violations, `WCAG AA violations on ${path}:\n${detail}`).toEqual([]);
  }
}

test.describe('Accessibility (WCAG AA) — golden-journey routes', () => {
  test('homepage', async ({page}) => {
    await auditPage(page, '/');
  });

  test('collections index', async ({page}) => {
    await auditPage(page, '/collections');
  });

  test('all-products collection', async ({page}) => {
    await auditPage(page, '/collections/all-products');
  });

  test('journal index', async ({page}) => {
    await auditPage(page, '/journal');
  });

  test('cart (empty state)', async ({page}) => {
    await auditPage(page, '/cart');
  });

  test('search (empty state)', async ({page}) => {
    await auditPage(page, '/search');
  });
});
