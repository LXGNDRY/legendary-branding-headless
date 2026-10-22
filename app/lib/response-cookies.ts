type CommittableSession = {isPending: boolean; commit: () => Promise<string>};

/**
 * Adds the pending session cookie WITHOUT replacing cookies a route already
 * set (notably the cart cookie from `cart.setCartId`). `Headers.set` would
 * drop every earlier `Set-Cookie`.
 */
export async function appendPendingSessionCookie(response: Response, session: CommittableSession) {
  if (!session.isPending) return;
  response.headers.append('Set-Cookie', await session.commit());
}

/** Carries every `Set-Cookie` from `from` onto `to` (e.g. through a redirect). */
export function copySetCookies(from: Response, to: Response) {
  if (from === to) return;
  for (const cookie of from.headers.getSetCookie()) {
    to.headers.append('Set-Cookie', cookie);
  }
}
