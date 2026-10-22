// @vitest-environment jsdom
import {act, cleanup, fireEvent, render, screen} from '@testing-library/react';
import {useState} from 'react';
import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest';
import {useFocusTrap} from './useFocusTrap';

function Dialog({onClose}: {onClose: () => void}) {
  const [count, setCount] = useState(0);
  // inline callback: a new identity on every render, like most callers
  const {containerRef} = useFocusTrap(true, () => onClose());
  return (
    <div>
      <button>outside</button>
      <div ref={containerRef}>
        <button>first</button>
        <input aria-label="field" />
        <button onClick={() => setCount((c) => c + 1)}>rerender {count}</button>
      </div>
    </div>
  );
}

describe('useFocusTrap', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    // jsdom has no layout, so offsetParent is null; the hook filters on it.
    Object.defineProperty(HTMLElement.prototype, 'offsetParent', {configurable: true, get: () => document.body});
  });
  afterEach(() => {
    cleanup();
    vi.useRealTimers();
  });

  it('keeps focus where the user put it when the component re-renders', async () => {
    render(<Dialog onClose={() => {}} />);
    await act(async () => vi.advanceTimersByTimeAsync(20));
    expect(document.activeElement).toBe(screen.getByText('first'));

    const field = screen.getByLabelText('field');
    field.focus();
    await act(async () => screen.getByText(/rerender/).click());
    await act(async () => vi.advanceTimersByTimeAsync(20));
    // before the fix the effect restarted and focus jumped back to the first control
    expect(document.activeElement).not.toBe(screen.getByText('first'));
  });

  it('calls the latest onEscape, not the first one', async () => {
    const first = vi.fn();
    const second = vi.fn();
    const {rerender} = render(<Dialog onClose={first} />);
    rerender(<Dialog onClose={second} />);
    await act(async () => {
      fireEvent.keyDown(document, {key: 'Escape'});
    });
    expect(second).toHaveBeenCalledTimes(1);
    expect(first).not.toHaveBeenCalled();
  });
});
