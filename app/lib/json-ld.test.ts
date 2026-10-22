import {describe, it, expect} from 'vitest';
import {serializeJsonLd} from './json-ld';

describe('serializeJsonLd', () => {
  const nasty = {
    name: '</script><script>alert(1)</script>',
    description: '<!-- <script> --> & "quotes"     emoji 🔥 é',
    nested: {list: ['</SCRIPT>', '<img src=x onerror=1>']},
  };

  it('never emits a raw < > or & that could end the script element', () => {
    const out = serializeJsonLd(nasty);
    expect(out).not.toMatch(/[<>&]/);
    expect(out.toLowerCase()).not.toContain('</script');
  });

  it('still parses back to exactly the original data', () => {
    expect(JSON.parse(serializeJsonLd(nasty))).toEqual(nasty);
  });
});
