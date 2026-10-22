import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest';

const captured: Array<{error: unknown; context?: Record<string, unknown>}> = [];
vi.mock('~/lib/monitoring', () => ({
  captureError: (error: unknown, context?: Record<string, unknown>) => captured.push({error, context}),
}));

import {optional} from './optional';

describe('optional', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    captured.length = 0;
  });
  afterEach(() => vi.useRealTimers());

  it('returns the value when the dependency succeeds in time', async () => {
    await expect(optional('x', Promise.resolve(42), {ms: 100, fallback: 0})).resolves.toBe(42);
    await expect(optional('x', () => Promise.resolve('ok'), {ms: 100, fallback: 'no'})).resolves.toBe('ok');
    expect(captured).toHaveLength(0);
  });

  it('falls back and reports when the dependency rejects', async () => {
    const boom = new Error('upstream down');
    await expect(optional('cart', Promise.reject(boom), {ms: 100, fallback: null})).resolves.toBeNull();
    expect(captured).toEqual([{error: boom, context: {optional: 'cart', failure: 'error'}}]);
  });

  it('falls back and reports when a synchronous factory throws', async () => {
    const result = optional(
      'menu',
      () => {
        throw new Error('sync failure');
      },
      {ms: 100, fallback: 'fallback'},
    );
    await expect(result).resolves.toBe('fallback');
    expect(captured[0].context).toEqual({optional: 'menu', failure: 'error'});
  });

  it('falls back and reports when the dependency exceeds its budget', async () => {
    const never = new Promise<string>(() => {});
    const pending = optional('menu', never, {ms: 100, fallback: 'slow'});
    await vi.advanceTimersByTimeAsync(101);
    await expect(pending).resolves.toBe('slow');
    expect((captured[0].error as Error).message).toContain('exceeded its 100ms budget');
    expect(captured[0].context).toEqual({optional: 'menu', failure: 'timeout'});
  });

  it('does not leak an unhandled rejection when a slow dependency rejects after its budget', async () => {
    const unhandled = vi.fn();
    process.on('unhandledRejection', unhandled);
    let rejectLate: (reason: Error) => void = () => {};
    const late = new Promise<string>((_, reject) => (rejectLate = reject));
    const pending = optional('cart', late, {ms: 50, fallback: 'x'});
    await vi.advanceTimersByTimeAsync(60);
    await pending;
    rejectLate(new Error('too late'));
    await vi.advanceTimersByTimeAsync(10);
    process.off('unhandledRejection', unhandled);
    expect(unhandled).not.toHaveBeenCalled();
  });
});
