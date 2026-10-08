// @vitest-environment jsdom
import {afterEach, describe, expect, it, vi} from 'vitest';
import {
  KLAVIYO_FORM_GRACE_MS,
  hasKlaviyoFormOpened,
  klaviyoGraceRemainingMs,
  markKlaviyoOnsiteLoading,
  onKlaviyoFormOpen,
  resetKlaviyoOnsiteForTests,
} from './klaviyo-onsite';

function dispatchKlaviyo(type: string) {
  window.dispatchEvent(new CustomEvent('klaviyoForms', {detail: {type, formId: 'XSqX3H'}}));
}

describe('klaviyo-onsite', () => {
  afterEach(() => resetKlaviyoOnsiteForTests());

  it('has no grace window until Klaviyo starts loading', () => {
    expect(klaviyoGraceRemainingMs()).toBe(0);
  });

  it('opens a grace window from the moment Klaviyo starts loading', () => {
    markKlaviyoOnsiteLoading(1_000);
    expect(klaviyoGraceRemainingMs(1_000)).toBe(KLAVIYO_FORM_GRACE_MS);
    expect(klaviyoGraceRemainingMs(1_000 + KLAVIYO_FORM_GRACE_MS)).toBe(0);
  });

  it('only counts popup/flyout opens, not other form events', () => {
    markKlaviyoOnsiteLoading();
    const listener = vi.fn();
    onKlaviyoFormOpen(listener);

    dispatchKlaviyo('embedOpen');
    dispatchKlaviyo('viewedStep');
    expect(hasKlaviyoFormOpened()).toBe(false);
    expect(listener).not.toHaveBeenCalled();

    dispatchKlaviyo('open');
    expect(hasKlaviyoFormOpened()).toBe(true);
    expect(listener).toHaveBeenCalledTimes(1);
  });

  it('ignores Klaviyo events when the on-site script was never loaded', () => {
    dispatchKlaviyo('open');
    expect(hasKlaviyoFormOpened()).toBe(false);
  });

  it('stops notifying after unsubscribe', () => {
    markKlaviyoOnsiteLoading();
    const listener = vi.fn();
    const unsubscribe = onKlaviyoFormOpen(listener);
    unsubscribe();
    dispatchKlaviyo('open');
    expect(listener).not.toHaveBeenCalled();
  });
});
