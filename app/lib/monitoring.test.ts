import {afterEach, describe, expect, it, vi} from 'vitest';
import {captureError, setServerErrorReporter} from './monitoring';

describe('captureError on the server', () => {
  afterEach(() => {
    setServerErrorReporter(null);
    vi.restoreAllMocks();
  });

  it('routes through the registered server reporter with its context', () => {
    const reporter = vi.fn();
    setServerErrorReporter(reporter);
    const error = new Error('boom');
    captureError(error, {route: 'api.wishlist'});
    expect(reporter).toHaveBeenCalledWith(error, {route: 'api.wishlist'});
  });

  it('falls back to the console when no reporter is registered', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    captureError(new Error('boom'));
    expect(spy).toHaveBeenCalled();
  });
});
