// @vitest-environment jsdom
import {render} from '@testing-library/react';
import {afterEach, describe, expect, it, vi} from 'vitest';
import {useReveal} from './useReveal';

function Section() {
  const ref = useReveal<HTMLElement>();
  return <section ref={ref} data-testid="s">content</section>;
}

afterEach(() => {
  vi.unstubAllGlobals();
});

function stubRect(top: number) {
  vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockReturnValue({top} as DOMRect);
}

describe('useReveal', () => {
  it('never hides content when IntersectionObserver is missing', () => {
    vi.stubGlobal('IntersectionObserver', undefined);
    stubRect(5000);
    const {getByTestId} = render(<Section />);
    expect(getByTestId('s').dataset.reveal).toBeUndefined();
  });

  it('does not hide content already in the viewport', () => {
    vi.stubGlobal('IntersectionObserver', class { observe() {} disconnect() {} });
    stubRect(10);
    const {getByTestId} = render(<Section />);
    expect(getByTestId('s').dataset.reveal).toBeUndefined();
  });

  it('arms below-fold content and reveals it on intersect', () => {
    let cb: (e: Array<{isIntersecting: boolean}>) => void = () => {};
    vi.stubGlobal('IntersectionObserver', class {
      constructor(fn: typeof cb) { cb = fn; }
      observe() {}
      disconnect() {}
    });
    stubRect(5000);
    const {getByTestId} = render(<Section />);
    expect(getByTestId('s').dataset.reveal).toBe('pending');
    cb([{isIntersecting: true}]);
    expect(getByTestId('s').dataset.reveal).toBeUndefined();
    expect(getByTestId('s').classList.contains('is-visible')).toBe(true);
  });

  it('respects reduced motion', () => {
    vi.stubGlobal('IntersectionObserver', class { observe() {} disconnect() {} });
    vi.stubGlobal('matchMedia', () => ({matches: true}));
    stubRect(5000);
    const {getByTestId} = render(<Section />);
    expect(getByTestId('s').dataset.reveal).toBeUndefined();
  });
});
