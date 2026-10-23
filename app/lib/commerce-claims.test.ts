import {describe, it, expect} from 'vitest';

// Every shipped source file and locale catalog, as raw text.
const files = import.meta.glob<string>(['/app/**/*.{ts,tsx,json}', '!/app/**/*.test.{ts,tsx}', '!/app/test/**'], {
  query: '?raw',
  import: 'default',
  eager: true,
});

// Guarantees that conflict with the published shipping policy (free shipping
// only from a threshold; duties/taxes added at checkout). They may only return
// from owner-approved structured facts, not as repeated literals.
const FORBIDDEN: [string, RegExp][] = [
  ['unconditional free shipping', /free\s+(standard\s+|worldwide\s+)?shipping\s+(on|for)\s+(every|all)\s+orders?/i],
  ['free shipping, every order', /shipping,?\s+every\s+order/i],
  ['duties included', /duties\s+(are\s+)?included|included\s+in\s+the\s+displayed\s+price/i],
  // Owner decision (2026-10-23): shipping, duties and returns wording is relayed from the store's policies, not written in code.
  ['hardcoded shipping/duties/taxes handling', /(shipping|duties|taxes)[^.<>"'`\n]{0,40}(calculated|shown|displayed|added)\s+(at|during)\s+checkout/i],
  ['hardcoded worldwide shipping', /(ships?|shipping|delivery)\s+worldwide|worldwide\s+(shipping|delivery)/i],
  ['free shipping translations', /Kostenloser\s+(weltweiter\s+)?(Standard)?[Vv]ersand|Envío\s+(estándar\s+)?gratis|Livraison\s+(standard\s+)?gratuite|मुफ्त\s+(स्टैंडर्ड\s+)?शिपिंग|Gratis\s+ongkir|Spedizione\s+(standard\s+)?gratuita|Frete\s+(padrão\s+)?grátis|Zölle\s+inbegriffen|Aranceles\s+incluidos|Droits\s+inclus|ड्यूटी\s+शामिल|Bea\s+masuk\s+sudah\s+termasuk|Dazi\s+inclusi|Impostos\s+de\s+importação\s+incluídos/i],
];

describe('commerce claims', () => {
  it('scans the app source', () => {
    expect(Object.keys(files).length).toBeGreaterThan(50);
  });

  it.each(FORBIDDEN)('contains no %s claim', (_name, pattern) => {
    const offenders = Object.entries(files)
      .filter(([, text]) => pattern.test(text))
      .map(([path]) => path);
    expect(offenders).toEqual([]);
  });
});
