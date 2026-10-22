import {afterEach, describe, expect, it} from 'vitest';
import {
  ALL_DENIED,
  ALL_GRANTED,
  CONSENT_STORAGE_KEY,
  consentFromShopify,
  consentToShopify,
  readConsent,
  reconcileConsent,
  resetConsentMemory,
  writeConsent,
} from '~/lib/consent';

function fakeStorage(initial: Record<string, string> = {}) {
  const data = {...initial};
  return {
    data,
    getItem: (key: string) => data[key] ?? null,
    setItem: (key: string, value: string) => {
      data[key] = value;
    },
    removeItem: (key: string) => {
      delete data[key];
    },
  };
}

const throwing = {
  getItem: () => {
    throw new Error('blocked');
  },
  setItem: () => {
    throw new Error('blocked');
  },
  removeItem: () => {
    throw new Error('blocked');
  },
};

describe('consent storage', () => {
  afterEach(resetConsentMemory);

  it('is undecided with no record', () => {
    expect(readConsent(fakeStorage())).toBeNull();
  });

  it('round-trips independent categories', () => {
    const storage = fakeStorage();
    writeConsent({analytics: true, marketing: false, preferences: true}, storage);
    expect(readConsent(storage)).toEqual({analytics: true, marketing: false, preferences: true});
  });

  it('migrates the legacy single flag without inventing choices', () => {
    expect(readConsent(fakeStorage({lb_cookie_consent: 'accepted'}))).toEqual(ALL_GRANTED);
    expect(readConsent(fakeStorage({lb_cookie_consent: 'rejected'}))).toEqual(ALL_DENIED);
    expect(readConsent(fakeStorage({lb_cookie_consent: 'maybe'}))).toBeNull();
  });

  it('removes the legacy flag once a new choice is written', () => {
    const storage = fakeStorage({lb_cookie_consent: 'accepted'});
    writeConsent(ALL_DENIED, storage);
    expect(storage.data.lb_cookie_consent).toBeUndefined();
    expect(readConsent(storage)).toEqual(ALL_DENIED);
  });

  it('treats corrupt or partial records as undecided', () => {
    for (const raw of ['not json', '{}', JSON.stringify({v: 2, analytics: true}), JSON.stringify({v: 1, analytics: true, marketing: true, preferences: true})]) {
      expect(readConsent(fakeStorage({[CONSENT_STORAGE_KEY]: raw}))).toBeNull();
    }
  });

  it('holds a choice for the visit when storage is unavailable', () => {
    writeConsent({analytics: true, marketing: false, preferences: false}, throwing);
    expect(readConsent(throwing)).toEqual({analytics: true, marketing: false, preferences: false});
  });
});

describe('Shopify mapping', () => {
  it('is undecided when Shopify has no value', () => {
    expect(consentFromShopify({analytics: '', marketing: '', preferences: ''})).toBeNull();
    expect(consentFromShopify(undefined)).toBeNull();
  });

  it('keeps categories independent and denies blanks', () => {
    expect(consentFromShopify({analytics: 'yes', marketing: 'no', preferences: ''})).toEqual({
      analytics: true,
      marketing: false,
      preferences: false,
    });
  });

  it('never opts in to sale of data', () => {
    expect(consentToShopify(ALL_GRANTED)).toMatchObject({sale_of_data: false});
  });
});

describe('reconcileConsent', () => {
  it('adopts a different Shopify decision, including a later revocation', () => {
    expect(reconcileConsent(ALL_GRANTED, ALL_DENIED)).toEqual({action: 'adopt', state: ALL_DENIED});
    expect(reconcileConsent(null, ALL_GRANTED)).toEqual({action: 'adopt', state: ALL_GRANTED});
  });

  it('pushes the saved choice only when Shopify has none', () => {
    expect(reconcileConsent(ALL_GRANTED, null)).toEqual({action: 'push', state: ALL_GRANTED});
  });

  it('does nothing when they agree or neither has a choice', () => {
    expect(reconcileConsent(ALL_GRANTED, {...ALL_GRANTED})).toEqual({action: 'none'});
    expect(reconcileConsent(null, null)).toEqual({action: 'none'});
  });
});
