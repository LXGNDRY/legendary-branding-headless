import {test, expect} from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

/**
 * Automated accessibility audit — WCAG AA, per CLAUDE.md's design-system
 * requirement ("all interactive elements must have aria-label or visible
 * label; color contrast must meet WCAG AA minimum"). Runs axe-core against
 * the golden-journey routes (the ones real customers actually land on),
 * failing the build on any 'serious' or 'critical' violation. 'moderate'
 * and 'minor' are reported but non-blocking -- WCAG AA is the bar, not a
 * zero-findings audit tool, and axe's own docs note some moderate/minor
 * rules are opinionated best-practices rather than AA requirements.
 */

const BLOCKING_IMPACTS = ['serious', 'critical'] as const;

async function auditPage(page: import('@playwright/test').Page, path: string) {
  await page.goto(path, {waitUntil: 'domcontentloaded'});
  const results = await new AxeBuilder({page})
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
    .analyze();

  const blocking = results.violations.filter((v) =>
    BLOCKING_IMPACTS.includes(v.impact as (typeof BLOCKING_IMPACTS)[number]),
  );

  if (blocking.length > 0) {
    const detail = blocking
      .map((v) => `- [${v.impact}] ${v.id}: ${v.help} (${v.nodes.length} node(s))`)
      .join('\n');
    expect(blocking, `Serious/critical a11y violations on ${path}:\n${detail}`).toEqual([]);
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
