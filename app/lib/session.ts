import {
  createCookieSessionStorage,
  type Session,
  type SessionData,
} from 'react-router';
import type {HydrogenSession, HydrogenSessionData} from '@shopify/hydrogen';

type HydrogenCombinedSessionData = HydrogenSessionData & SessionData;
type AppSessionType = Session<HydrogenCombinedSessionData, SessionData>;
type AppSessionStorage = ReturnType<
  typeof createCookieSessionStorage<HydrogenCombinedSessionData, SessionData>
>;

/**
 * Detect if we're running in production mode.
 *
 * Uses import.meta.env.PROD — a compile-time constant set by Vite/Rollup.
 * On Oxygen (production/preview), PROD is always true.
 * On local dev, PROD is false.
 *
 * DO NOT use process.env.NODE_ENV — it's a Node API that doesn't exist
 * in the Cloudflare Workers runtime (Oxygen).
 */
const IS_PRODUCTION = import.meta.env.PROD;

export class AppSession implements HydrogenSession {
  #sessionStorage: AppSessionStorage;
  #session: AppSessionType;
  isPending = false;

  static async init(request: Request, secrets: string[]) {
    const url = new URL(request.url);

    const sessionStorage = createCookieSessionStorage<
      HydrogenSessionData & SessionData,
      SessionData
    >({
      cookie: {
        name: '__session',
        httpOnly: true,
        path: '/',
        sameSite: 'lax',
        // Secure cookie in production or any HTTPS context
        secure: IS_PRODUCTION || url.protocol === 'https:',
        secrets,
        // 7 day session expiry
        maxAge: 60 * 60 * 24 * 7,
      },
    });

    const session = await sessionStorage
      .getSession(request.headers.get('Cookie'))
      .catch(() => sessionStorage.getSession());

    return new AppSession(sessionStorage, session);
  }

  constructor(sessionStorage: AppSessionStorage, session: AppSessionType) {
    this.#sessionStorage = sessionStorage;
    this.#session = session;
  }

  has(key: string) {
    return this.#session.has(key);
  }

  get<Key extends string>(key: Key) {
    return this.#session.get(key);
  }

  set(key: string, value: string) {
    this.isPending = true;
    this.#session.set(key, value);
  }

  unset(key: string) {
    this.isPending = true;
    this.#session.unset(key);
  }

  flash(key: string, value: string) {
    this.isPending = true;
    this.#session.flash(key, value);
  }

  async commit() {
    return this.#sessionStorage.commitSession(this.#session);
  }

  async destroy() {
    return this.#sessionStorage.destroySession(this.#session);
  }
}
