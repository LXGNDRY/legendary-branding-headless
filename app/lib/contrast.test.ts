import {readFileSync} from 'node:fs';
import {describe, expect, it} from 'vitest';

const css = readFileSync(new URL('../styles/app.css', import.meta.url), 'utf8');

function token(name: string): string {
  const m = css.match(new RegExp(`--${name}:\\s*(#[0-9a-fA-F]{6})`));
  if (!m) throw new Error(`token --${name} not found as a hex value`);
  return m[1];
}

function luminance(hex: string) {
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255).map((c) =>
    c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4,
  );
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function ratio(a: string, b: string) {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

// Foreground/background pairs the components actually render (WCAG AA body text = 4.5:1).
const PAIRS: Array<[string, string, string]> = [
  ['color-text-primary', 'color-bg-level-0', 'body text'],
  ['color-text-primary', 'color-bg-level-3', 'fulfilled badge / dark chip'],
  ['color-text-secondary', 'color-bg-level-1', 'secondary text on section surface'],
  ['color-text-tertiary', 'color-bg-level-2', 'metadata on cards'],
  ['color-text-inverse', 'color-text-primary', 'waitlist/primary button'],
  ['color-text-inverse', 'color-text-secondary', 'waitlist button hover'],
  ['color-text-inverse', 'color-accent', 'accent button'],
  ['color-error', 'color-bg-level-1', 'form errors'],
  ['color-sale-text', 'color-bg-level-0', 'sale price text'],
];

describe('theme token contrast (WCAG AA)', () => {
  it.each(PAIRS)('%s on %s ≥ 4.5:1 (%s)', (fg, bg) => {
    expect(ratio(token(fg), token(bg))).toBeGreaterThanOrEqual(4.5);
  });

  it('catches the old black-on-dark defect', () => {
    expect(ratio('#000000', token('color-bg-level-1'))).toBeLessThan(4.5);
  });
});
