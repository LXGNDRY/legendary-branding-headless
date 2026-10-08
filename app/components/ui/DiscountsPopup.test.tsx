// @vitest-environment jsdom
import {act, cleanup, render, screen} from '@testing-library/react';
import {MemoryRouter} from 'react-router';
import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest';
import DiscountsPopup from './DiscountsPopup';
import type {ActiveDiscount} from '~/lib/discounts';
import {
  KLAVIYO_FORM_GRACE_MS,
  markKlaviyoOnsiteLoading,
  resetKlaviyoOnsiteForTests,
} from '~/lib/klaviyo-onsite';

const discounts: ActiveDiscount[] = [
  {id: '1', title: 'Outerwear', summary: '15% off Outerwear', kind: 'automatic'},
];

function renderPopup() {
  return render(
    <MemoryRouter>
      <DiscountsPopup discounts={discounts} />
    </MemoryRouter>,
  );
}

const dialog = () => screen.queryByRole('dialog', {name: /what's live right now/i});

function klaviyoOpens() {
  act(() => {
    window.dispatchEvent(new CustomEvent('klaviyoForms', {detail: {type: 'open'}}));
  });
}

describe('DiscountsPopup vs Klaviyo', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    window.localStorage.clear();
  });

  afterEach(() => {
    cleanup();
    resetKlaviyoOnsiteForTests();
    vi.useRealTimers();
  });

  it('shows after 5s when Klaviyo is not active', async () => {
    renderPopup();
    await act(async () => vi.advanceTimersByTime(5_000));
    expect(dialog()).not.toBeNull();
  });

  it('waits out the Klaviyo grace window, then shows if Klaviyo stayed closed', async () => {
    markKlaviyoOnsiteLoading();
    renderPopup();
    await act(async () => vi.advanceTimersByTime(5_000));
    expect(dialog()).toBeNull();
    await act(async () => vi.advanceTimersByTime(KLAVIYO_FORM_GRACE_MS));
    expect(dialog()).not.toBeNull();
  });

  it('never shows on a page view where the Klaviyo popup opened, and stays eligible later', async () => {
    markKlaviyoOnsiteLoading();
    renderPopup();
    await act(async () => vi.advanceTimersByTime(6_000));
    klaviyoOpens();
    await act(async () => vi.advanceTimersByTime(60_000));
    expect(dialog()).toBeNull();
    expect(window.localStorage.getItem('lb_discounts_popup_last_shown')).toBeNull();
  });

  it('closes immediately if Klaviyo opens while it is already showing', async () => {
    renderPopup();
    await act(async () => vi.advanceTimersByTime(5_000));
    expect(dialog()).not.toBeNull();
    markKlaviyoOnsiteLoading();
    klaviyoOpens();
    expect(dialog()).toBeNull();
    expect(document.body.style.overflow).not.toBe('hidden');
  });
});
