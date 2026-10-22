import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest';
import {captureServerError, drainServerReports, initSentryServer, redactText, redactUrl} from './sentry.server';

describe('redaction', () => {
  it('drops every query value but keeps the key names', () => {
    expect(redactUrl('https://shop.test/account/authorize?code=SECRETCODE&state=abc&utm=1&utm=2')).toBe(
      'https://shop.test/account/authorize?code=[redacted]&state=[redacted]&utm=[redacted]',
    );
    expect(redactUrl('https://shop.test/products/tee')).toBe('https://shop.test/products/tee');
    expect(redactUrl('not a url')).toBe('[unparseable url]');
  });

  it('removes tokens, OAuth parameters and email addresses from free text', () => {
    const text = 'GET /cb?code=abc123&email=a@b.co failed for jane.doe+x@example.com with shpat_deadbeef1234';
    const out = redactText(text);
    expect(out).not.toMatch(/abc123|jane\.doe|a@b\.co|deadbeef1234/);
    expect(out).toContain('code=[redacted]');
    expect(out).toContain('[email]');
    expect(out).toContain('[token]');
  });
});

describe('captureServerError', () => {
  let fetchSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(null, {status: 200}));
    initSentryServer({PUBLIC_SENTRY_DSN: 'https://key123@o1.ingest.sentry.io/456', SHOPIFY_HYDROGEN_DEPLOYMENT_ID: 'dep-42'} as unknown as Env);
  });

  afterEach(() => vi.restoreAllMocks());

  const lastEvent = () => {
    const body = String(fetchSpy.mock.calls.at(-1)![1]?.body);
    return JSON.parse(body.split('\n')[2]);
  };

  it('sends a redacted event with the real release and a live/preview environment', async () => {
    const request = new Request('https://www.legendary-branding.com/account/authorize?code=SECRETCODE&state=xyz');
    captureServerError(new Error('callback failed for shopper@example.com code=SECRETCODE'), {
      request,
      extra: {note: 'token shpat_abc999'},
    });
    await drainServerReports();

    const event = lastEvent();
    const raw = JSON.stringify(event);
    expect(raw).not.toMatch(/SECRETCODE|shopper@example|shpat_abc999|xyz/);
    expect(event.release).toBe('dep-42');
    expect(event.environment).toBe('production');
    expect(event.extra.url).toBe('https://www.legendary-branding.com/account/authorize?code=[redacted]&state=[redacted]');
  });

  it('tags previews and local servers as preview, never production', async () => {
    captureServerError(new Error('x'), {request: new Request('https://shop-abc.myshopify.dev/')});
    captureServerError(new Error('y'), {request: new Request('http://localhost:3000/')});
    captureServerError(new Error('z'));
    await drainServerReports();
    for (const call of fetchSpy.mock.calls) {
      expect(JSON.parse(String(call[1]?.body).split('\n')[2]).environment).toBe('preview');
    }
  });

  it('bounds delivery with a timeout signal and hands the send to waitUntil and the drain', async () => {
    const waitUntil = vi.fn();
    captureServerError(new Error('x'), {waitUntil});
    expect(fetchSpy.mock.calls[0][1]?.signal).toBeInstanceOf(AbortSignal);
    expect(waitUntil).toHaveBeenCalledTimes(1);
    await expect(drainServerReports()).resolves.toBeDefined();
  });

  it('never throws or breaks the response when delivery fails', async () => {
    fetchSpy.mockRejectedValue(new Error('sentry down'));
    expect(() => captureServerError(new Error('x'))).not.toThrow();
    await expect(drainServerReports()).resolves.toBeDefined();
  });

  it('does nothing network-wise when no DSN is configured', async () => {
    vi.resetModules();
    const fresh = await import('./sentry.server');
    fresh.initSentryServer({} as unknown as Env);
    fetchSpy.mockClear();
    fresh.captureServerError(new Error('x'));
    expect(fetchSpy).not.toHaveBeenCalled();
  });
});
