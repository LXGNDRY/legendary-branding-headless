import {afterEach, describe, expect, it, vi} from 'vitest';
import {captureError, captureMessage, initSentry, setServerErrorReporter} from './monitoring';

afterEach(() => {
  setServerErrorReporter(null);
  vi.restoreAllMocks();
});

describe('monitoring (server runtime)', () => {
  it('routes errors through the registered server reporter with context', () => {
    const reporter = vi.fn();
    setServerErrorReporter(reporter);
    const error = new Error('boom');
    captureError(error, {route: '/products/x'});
    expect(reporter).toHaveBeenCalledWith(error, {route: '/products/x'});
  });

  it('falls back to console.error when no reporter is registered', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    captureError('plain string');
    expect(spy).toHaveBeenCalledOnce();
  });

  it('logs messages at the matching console level', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const err = vi.spyOn(console, 'error').mockImplementation(() => {});
    const log = vi.spyOn(console, 'log').mockImplementation(() => {});
    captureMessage('w', 'warning');
    captureMessage('e', 'error');
    captureMessage('i');
    expect(warn).toHaveBeenCalledOnce();
    expect(err).toHaveBeenCalledOnce();
    expect(log).toHaveBeenCalledOnce();
  });

  it('initSentry never loads the client SDK without a DSN or in a server runtime', async () => {
    await expect(initSentry(undefined)).resolves.toBeUndefined();
    await expect(initSentry('https://example@o0.ingest.sentry.io/0')).resolves.toBeUndefined();
  });
});
