import {describe, it, expect} from 'vitest';
import {appendPendingSessionCookie, copySetCookies} from './response-cookies';

const session = (isPending: boolean) => ({isPending, commit: async () => 'session=abc; Path=/; HttpOnly'});

describe('appendPendingSessionCookie', () => {
  it('keeps the cart cookie a route already set alongside the session cookie', async () => {
    const res = new Response('ok', {headers: {'Set-Cookie': 'cart=123; Path=/'}});
    await appendPendingSessionCookie(res, session(true));
    expect(res.headers.getSetCookie()).toEqual(['cart=123; Path=/', 'session=abc; Path=/; HttpOnly']);
  });

  it('adds nothing when the session is not pending', async () => {
    const res = new Response('ok', {headers: {'Set-Cookie': 'cart=123; Path=/'}});
    await appendPendingSessionCookie(res, session(false));
    expect(res.headers.getSetCookie()).toEqual(['cart=123; Path=/']);
  });
});

describe('copySetCookies', () => {
  it('carries both cookies onto a redirect response', () => {
    const from = new Response(null, {status: 404});
    from.headers.append('Set-Cookie', 'cart=123; Path=/');
    from.headers.append('Set-Cookie', 'session=abc; Path=/');
    const to = new Response(null, {status: 301, headers: {Location: '/new'}});
    copySetCookies(from, to);
    expect(to.headers.getSetCookie()).toEqual(['cart=123; Path=/', 'session=abc; Path=/']);
  });

  it('is a no-op for the same response', () => {
    const res = new Response(null);
    res.headers.append('Set-Cookie', 'a=1');
    copySetCookies(res, res);
    expect(res.headers.getSetCookie()).toEqual(['a=1']);
  });
});
