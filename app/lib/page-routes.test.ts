import {describe, expect, it} from 'vitest';
import {canonicalPagePath, isPolicyPageHandle} from './page-routes';

describe('canonicalPagePath', () => {
  it('puts the policy and help documents under /policies', () => {
    expect(canonicalPagePath('refund-policy')).toBe('/policies/refund-policy');
    expect(canonicalPagePath('size-guide')).toBe('/policies/size-guide');
    expect(canonicalPagePath('legendary_branding_faqs')).toBe('/policies/legendary_branding_faqs');
  });

  it('keeps every other page under /pages', () => {
    expect(canonicalPagePath('the-ultimate-streetwear-guide')).toBe('/pages/the-ultimate-streetwear-guide');
    expect(isPolicyPageHandle('data-sharing-opt-out')).toBe(false);
  });
});
