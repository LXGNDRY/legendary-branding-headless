import {describe, it, expect} from 'vitest';
import {sanitizeHtml} from './safe-html';

const attacks: [string, string][] = [
  ['script tag', '<p>hi</p><script>alert(1)</script>'],
  ['uppercase/mixed script', '<ScRiPt>alert(1)</sCrIpT>'],
  ['img onerror', '<img src="x" onerror="alert(1)">'],
  ['svg onload', '<svg onload="alert(1)"><circle/></svg>'],
  ['svg script', '<svg><script>alert(1)</script></svg>'],
  ['javascript href', '<a href="javascript:alert(1)">x</a>'],
  ['entity-encoded javascript href', '<a href="&#106;avascript:alert(1)">x</a>'],
  ['tab-split javascript href', '<a href="java\tscript:alert(1)">x</a>'],
  ['control-char javascript href', '<a href="\u0001javascript:alert(1)">x</a>'],
  ['data url href', '<a href="data:text/html,<script>alert(1)</script>">x</a>'],
  ['vbscript href', '<a href="vbscript:msgbox(1)">x</a>'],
  ['data img src', '<img src="data:image/svg+xml;base64,PHN2Zz4=">'],
  ['iframe', '<iframe src="https://evil.test"></iframe>'],
  ['object/embed', '<object data="x"></object><embed src="x">'],
  ['form/input', '<form action="https://evil.test"><input name="p"><button>go</button></form>'],
  ['style tag', '<style>body{display:none}</style>'],
  ['style attribute', '<p style="position:fixed;inset:0">x</p>'],
  ['event handler on div', '<div onclick="alert(1)" onmouseover="alert(2)">x</div>'],
  ['meta refresh', '<meta http-equiv="refresh" content="0;url=https://evil.test">'],
  ['base tag', '<base href="https://evil.test/">'],
  ['math/mXSS', '<math><mtext><table><mglyph><style><img src=x onerror=alert(1)>'],
  ['noscript mXSS', '<noscript><p title="</noscript><img src=x onerror=alert(1)>">'],
  ['comment breakout', '<!--><img src=x onerror=alert(1)>-->'],
  ['template', '<template><script>alert(1)</script></template>'],
];

describe('sanitizeHtml', () => {
  it.each(attacks)('neutralizes %s', (_name, html) => {
    const out = sanitizeHtml(html).toLowerCase();
    expect(out).not.toMatch(/<script|<svg|<iframe|<object|<embed|<form|<input|<style|<meta|<base|<template|<math/);
    expect(out).not.toMatch(/\son[a-z]+\s*=/);
    expect(out).not.toMatch(/javascript:|vbscript:|data:/);
    expect(out).not.toMatch(/\sstyle\s*=/);
  });

  it('keeps ordinary product description markup', () => {
    const html =
      '<p>Heavyweight <strong>cotton</strong> tee.</p><ul><li>Pre-shrunk</li><li>Boxy fit</li></ul>' +
      '<h3>Care</h3><p>Wash <em>cold</em>. <a href="/pages/size-guide">Size guide</a></p>';
    expect(sanitizeHtml(html)).toBe(html);
  });

  it('keeps size tables and https images', () => {
    const html =
      '<table><thead><tr><th scope="col">Size</th><th colspan="2">Chest</th></tr></thead>' +
      '<tbody><tr><td>M</td><td>40</td><td>in</td></tr></tbody></table>' +
      '<p><img src="https://cdn.shopify.com/s/files/a.jpg" alt="Front" width="800" height="600"></p>';
    expect(sanitizeHtml(html)).toBe(html);
  });

  it('keeps http(s), mailto, tel, relative and fragment links', () => {
    for (const href of ['https://example.com/a', 'http://example.com', 'mailto:lb@legendary-branding.com', 'tel:+15555550100', '/policies/refund-policy', '#sizes', '?page=2']) {
      expect(sanitizeHtml(`<a href="${href}">x</a>`)).toBe(`<a href="${href}">x</a>`);
    }
  });

  it('adds rel to links that open a new tab and drops other targets', () => {
    expect(sanitizeHtml('<a href="https://a.test" target="_blank">x</a>')).toBe(
      '<a href="https://a.test" target="_blank" rel="noopener noreferrer">x</a>',
    );
    expect(sanitizeHtml('<a href="https://a.test" target="_top" rel="opener">x</a>')).toBe('<a href="https://a.test">x</a>');
  });

  it('unwraps unknown tags but keeps their text', () => {
    expect(sanitizeHtml('<custom-tag><p>kept</p></custom-tag>')).toBe('<p>kept</p>');
    expect(sanitizeHtml('<font color="red">plain</font>')).toBe('plain');
  });

  it('escapes text so literal markup stays inert', () => {
    expect(sanitizeHtml('<p>&lt;script&gt;alert(1)&lt;/script&gt;</p>')).toBe('<p>&lt;script&gt;alert(1)&lt;/script&gt;</p>');
  });

  it('returns an empty string for empty input', () => {
    expect(sanitizeHtml(null)).toBe('');
    expect(sanitizeHtml(undefined)).toBe('');
    expect(sanitizeHtml('')).toBe('');
  });
});
