import {describe, it, expect} from 'vitest';
import {parseContentBlocks} from './content-blocks';

describe('parseContentBlocks', () => {
  it('returns [] for missing, invalid or non-array JSON', () => {
    expect(parseContentBlocks(null)).toEqual([]);
    expect(parseContentBlocks('{nope')).toEqual([]);
    expect(parseContentBlocks('{"type":"quote"}')).toEqual([]);
  });

  it('drops unknown types and non-object entries', () => {
    const out = parseContentBlocks(JSON.stringify([null, 5, 'x', {type: 'script'}, {type: 'quote', quote: 'ok'}]));
    expect(out).toEqual([{type: 'quote', quote: 'ok'}]);
  });

  it('accepts safe links and https images', () => {
    const [block] = parseContentBlocks(
      JSON.stringify([{type: 'cta', title: 'Go', button_text: 'Shop', button_link: '/collections/all', image: 'https://cdn.shopify.com/a.jpg'}]),
    );
    expect(block.button_link).toBe('/collections/all');
    expect(block.image).toBe('https://cdn.shopify.com/a.jpg');
  });

  it.each(['javascript:alert(1)', 'data:text/html,x', '//evil.test', '/\\evil.test', 'vbscript:x', 5])(
    'drops unsafe button_link %s',
    (link) => {
      const [block] = parseContentBlocks(JSON.stringify([{type: 'cta', button_link: link}]));
      expect(block.button_link).toBeUndefined();
    },
  );

  it.each(['http://insecure.test/a.jpg', 'javascript:alert(1)', 'data:image/png;base64,AAAA', 5])('drops unsafe image %s', (image) => {
    const [block] = parseContentBlocks(JSON.stringify([{type: 'image_text', image}]));
    expect(block.image).toBeUndefined();
  });

  it('ignores non-string text fields and bounds the block count', () => {
    const [block] = parseContentBlocks(JSON.stringify([{type: 'heading', title: {x: 1}, text: 'ok'}]));
    expect(block).toEqual({type: 'heading', text: 'ok'});
    const many = Array.from({length: 80}, () => ({type: 'heading', title: 't'}));
    expect(parseContentBlocks(JSON.stringify(many))).toHaveLength(50);
  });
});
