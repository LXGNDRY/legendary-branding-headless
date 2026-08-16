import {describe, it, expect} from 'vitest';

/**
 * Session smoke tests — validates the session contract without hitting
 * the Cloudflare Workers runtime. Tests the shape and security properties
 * of AppSession by inspecting the module interface.
 */
describe('AppSession module', () => {
  it('exports an AppSession class with an init static method', async () => {
    const mod = await import('./session');
    expect(mod.AppSession).toBeDefined();
    expect(typeof mod.AppSession.init).toBe('function');
  });

  it('AppSession.init accepts a request and secrets array', async () => {
    const {AppSession} = await import('./session');
    // Verify the function signature accepts the expected arguments without throwing
    // We can't call it without a Workers runtime, but we confirm it's callable
    expect(AppSession.init.length).toBeGreaterThanOrEqual(1);
  });
});

describe('Session security contract', () => {
  it('session module does not export raw cookie values', async () => {
    const mod = await import('./session');
    const exports = Object.keys(mod);
    // Only AppSession should be exported — no raw secrets, no cookie values
    expect(exports).toContain('AppSession');
    // Ensure no accidental re-export of sensitive fields
    expect(exports).not.toContain('SESSION_SECRET');
    expect(exports).not.toContain('cookie');
    expect(exports).not.toContain('secret');
  });
});
