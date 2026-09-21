import {describe, expect, it} from 'vitest';
import {faqPageSchema, parseFaqFromHtml} from './SeoSchema';

describe('parseFaqFromHtml', () => {
  it('extracts question/answer pairs from <details><summary> markup', () => {
    const html = `
      <details>
        <summary>What sizes do you carry?</summary>
        <p>S to 3XL.</p>
      </details>
      <details>
        <summary>Do you ship internationally?</summary>
        <p>Yes, free worldwide shipping.</p>
      </details>
    `;
    expect(parseFaqFromHtml(html)).toEqual([
      {question: 'What sizes do you carry?', answer: 'S to 3XL.'},
      {question: 'Do you ship internationally?', answer: 'Yes, free worldwide shipping.'},
    ]);
  });

  it('strips nested tags and merges multi-paragraph/list answers into one string', () => {
    const html = `
      <details>
        <summary>How long does delivery take?</summary>
        <p>Estimated delivery times:</p>
        <ul><li><strong>USA:</strong> 7-10 days</li></ul>
      </details>
    `;
    expect(parseFaqFromHtml(html)).toEqual([
      {question: 'How long does delivery take?', answer: 'Estimated delivery times: USA: 7-10 days'},
    ]);
  });

  it('returns an empty array for content with no <details> blocks', () => {
    expect(parseFaqFromHtml('<p>Just a regular policy page.</p>')).toEqual([]);
  });
});

describe('faqPageSchema', () => {
  it('builds valid FAQPage JSON-LD from parsed items', () => {
    const schema = faqPageSchema([{question: 'Q1', answer: 'A1'}]);
    expect(schema).toEqual({
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: [
        {
          '@type': 'Question',
          name: 'Q1',
          acceptedAnswer: {'@type': 'Answer', text: 'A1'},
        },
      ],
    });
  });
});
