import axe from 'axe-core';

type Violation = {id: string; impact?: string | null; help: string; nodes: Array<{target: unknown[]; html: string}>};

/**
 * Runs axe-core on a rendered tree and returns the violations as readable text (empty when clean).
 *
 * NOTE: jsdom has no layout or computed colors, so `color-contrast` cannot run here (contrast is checked on the
 * real worker in e2e/a11y.spec.ts), and `region` is a page-level rule that does not apply to a fragment.
 */
export async function a11yViolations(root: Element = document.body): Promise<string[]> {
  const results = await axe.run(root, {
    rules: {'color-contrast': {enabled: false}, region: {enabled: false}},
    resultTypes: ['violations'],
  });
  return (results.violations as Violation[]).map(
    (v) => `${v.id} (${v.impact}): ${v.help}\n` + v.nodes.map((n) => `  ${n.target.join(' ')}  ${n.html.slice(0, 120)}`).join('\n'),
  );
}
