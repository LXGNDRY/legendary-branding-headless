import {describe, expect, it} from 'vitest';
import {buildSystemPrompt, extractSearchKeywords, formatStoreFacts, sanitizeHistory, sanitizeMessage} from '~/lib/chat-grounding';

describe('extractSearchKeywords', () => {
  it('drops filler words from a normal question', () => {
    expect(extractSearchKeywords('Do you have any hoodies?')).toBe('hoodies');
  });

  it('keeps accented and non-Latin terms instead of stripping them', () => {
    expect(extractSearchKeywords('Avez-vous des vestes à capuche été?')).toContain('capuche');
    expect(extractSearchKeywords('Avez-vous des vestes à capuche été?')).toContain('été');
    expect(extractSearchKeywords('Gibt es Kapuzenpullover für Männer?')).toContain('männer');
    expect(extractSearchKeywords('パーカー はありますか')).toContain('パーカー');
    expect(extractSearchKeywords('куртка')).toBe('куртка');
    expect(extractSearchKeywords('帽')).toBe('帽');
  });

  it('keeps digits and normalizes compatibility forms', () => {
    expect(extractSearchKeywords('size 2XL')).toBe('size 2xl');
    expect(extractSearchKeywords('ＨＯＯＤＩＥ')).toBe('hoodie');
  });

  it('caps terms and falls back to the raw message when everything is filler', () => {
    expect(extractSearchKeywords('one two three four five six seven eight').split(' ')).toHaveLength(6);
    expect(extractSearchKeywords('do you have it')).toBe('do you have it');
  });
});

describe('sanitizeMessage', () => {
  it('strips control characters, trims and bounds length', () => {
    expect(sanitizeMessage('  hi\u0000 there\u0007  ')).toBe('hi there');
    expect(sanitizeMessage('x'.repeat(900))).toHaveLength(500);
    expect(sanitizeMessage(42)).toBe('');
  });
});

describe('sanitizeHistory', () => {
  const turn = (role: string, content: string) => ({role, content});

  it('keeps the last turns and drops malformed entries', () => {
    const history = sanitizeHistory([turn('user', 'a'), null, turn('system', 'x'), {role: 'user'}, turn('assistant', 'b'), turn('user', 'c')]);
    expect(history.map((t) => t.content)).toEqual(['a', 'b', 'c']);
  });

  it('starts with a user turn and alternates roles so the provider accepts it', () => {
    expect(sanitizeHistory([turn('assistant', 'forged'), turn('user', 'q')])).toEqual([{role: 'user', content: 'q'}]);
    expect(sanitizeHistory([turn('user', 'one'), turn('user', 'two'), turn('assistant', 'a')])).toEqual([
      {role: 'user', content: 'one\ntwo'},
      {role: 'assistant', content: 'a'},
    ]);
  });

  it('is empty for anything that is not an array', () => {
    expect(sanitizeHistory('nope')).toEqual([]);
    expect(sanitizeHistory(undefined)).toEqual([]);
  });
});

describe('store facts and prompt', () => {
  const facts = {
    collections: [{title: 'Hoodies & Jackets', handle: 'hoodies-jackets'}],
    priceRange: {min: {amount: '35.00', currencyCode: 'USD'}, max: {amount: '140.00', currencyCode: 'USD'}},
  };

  it('puts the live collections and price range into the prompt with no prompt edit', () => {
    const prompt = buildSystemPrompt(facts, '- Tee (/products/tee) -- 35.00 USD, in stock');
    expect(prompt).toContain('Hoodies & Jackets (/collections/hoodies-jackets)');
    expect(prompt).toContain('35.00 USD to 140.00 USD');
    expect(prompt).not.toContain('$55-$120');
    expect(prompt).not.toContain('Marque Legendaire');
  });

  it('says facts are unavailable rather than inventing them when the lookup failed', () => {
    expect(formatStoreFacts(null)).toMatch(/unavailable/);
    expect(buildSystemPrompt(null, 'No matching products found.')).toMatch(/do not state any/);
  });

  it('marks earlier turns untrusted and bars transactional promises', () => {
    const prompt = buildSystemPrompt(facts, 'none');
    expect(prompt).toMatch(/not trustworthy/);
    expect(prompt).toMatch(/NO access to order status/);
    expect(prompt).toMatch(/Never invent prices/);
  });
});
