// @vitest-environment jsdom
import {act, cleanup, render, screen} from '@testing-library/react';
import {StrictMode} from 'react';
import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest';
import {WishlistProvider, useWishlist} from './Wishlist';

const A = {id: 'gid://shopify/Product/1', handle: 'tee-1'};
const B = {id: 'gid://shopify/Product/2', handle: 'tee-2'};
const entry = (p: {id: string; handle: string}, addedAt = 1_000) => ({...p, addedAt});

function Probe() {
  const {items, add, remove, syncStatus, isLoading, toggle} = useWishlist();
  return (
    <div>
      <p data-testid="handles">{items.map((i) => i.handle).join(',')}</p>
      <p data-testid="status">{isLoading ? 'loading-local' : syncStatus}</p>
      <button onClick={() => add(A)}>add-a</button>
      <button onClick={() => add(B)}>add-b</button>
      <button onClick={() => remove(A.handle)}>remove-a</button>
      <button onClick={() => add({id: 'gid://shopify/Product/9999', handle: 'overflow'})}>add-overflow</button>
      <p data-testid="toggle-result" />
      <button onClick={(e) => {
        const r = toggle({id: 'gid://shopify/Product/9999', handle: 'overflow'});
        (e.currentTarget.previousSibling as HTMLElement).textContent = r;
      }}>toggle-overflow</button>
    </div>
  );
}

function mount(isLoggedIn: boolean, strict = false) {
  const tree = (loggedIn: boolean) => (
    <WishlistProvider isLoggedIn={loggedIn}>
      <Probe />
    </WishlistProvider>
  );
  const wrap = (node: React.ReactNode) => (strict ? <StrictMode>{node}</StrictMode> : node);
  const utils = render(wrap(tree(isLoggedIn)));
  return {...utils, setLoggedIn: (v: boolean) => utils.rerender(wrap(tree(v)))};
}

const handles = () => screen.getByTestId('handles').textContent;
const status = () => screen.getByTestId('status').textContent;
const click = (name: string) => act(async () => screen.getByText(name).click());
const flush = (ms = 0) => act(async () => vi.advanceTimersByTimeAsync(ms));

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {status, headers: {'Content-Type': 'application/json'}});
}

describe('WishlistProvider', () => {
  let fetchMock: ReturnType<typeof vi.fn>;
  const posts = () => fetchMock.mock.calls.filter(([, init]) => init?.method === 'POST');

  beforeEach(() => {
    vi.useFakeTimers();
    window.localStorage.clear();
    fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
    vi.useRealTimers();
  });

  describe('guests', () => {
    it('stores identity only and never calls the API', async () => {
      mount(false);
      await flush();
      await click('add-a');
      expect(handles()).toBe('tee-1');
      const saved = JSON.parse(window.localStorage.getItem('lb_wishlist')!);
      expect(saved.items).toHaveLength(1);
      expect(Object.keys(saved.items[0]).sort()).toEqual(['addedAt', 'handle', 'id']);
      expect(fetchMock).not.toHaveBeenCalled();
    });

    it('migrates legacy snapshots by dropping price and title', async () => {
      window.localStorage.setItem(
        'lb_wishlist',
        JSON.stringify({items: [{...entry(A), title: 'Tee', price: '10.00', image: 'x'}], savedAt: Date.now()}),
      );
      mount(false);
      await flush();
      expect(handles()).toBe('tee-1');
      await click('add-b');
      const saved = JSON.parse(window.localStorage.getItem('lb_wishlist')!);
      expect(saved.items.every((i: Record<string, unknown>) => !('price' in i) && !('title' in i))).toBe(true);
    });

    it.each(['{nope', 'null', '[1]', '{"items":{"a":1},"savedAt":1}', '"x"'])('survives corrupt storage %s', async (raw) => {
      window.localStorage.setItem('lb_wishlist', raw);
      mount(false);
      await flush();
      expect(handles()).toBe('');
      await click('add-a');
      expect(handles()).toBe('tee-1');
    });

    it('survives unavailable storage', async () => {
      vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
        throw new Error('denied');
      });
      vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
        throw new Error('denied');
      });
      mount(false);
      await flush();
      await click('add-a');
      expect(handles()).toBe('tee-1');
    });
  });

  describe('logged in', () => {
    it('does not write before the server read finishes, then merges and writes once', async () => {
      let resolveGet: (r: Response) => void = () => {};
      fetchMock.mockImplementation((_url: string, init?: RequestInit) =>
        init?.method === 'POST'
          ? Promise.resolve(json({success: true}))
          : new Promise<Response>((resolve) => (resolveGet = resolve)),
      );
      mount(true);
      await flush();
      expect(status()).toBe('loading');

      await click('add-a'); // edit while the slow read is still pending
      await flush(2_000);
      expect(posts()).toHaveLength(0);

      await act(async () => resolveGet(json({items: [entry(B, 500)]})));
      await flush(600);
      expect(handles()).toBe('tee-2,tee-1');
      expect(posts()).toHaveLength(1);
      const body = JSON.parse(String(posts()[0][1].body));
      expect(body.items.map((i: {handle: string}) => i.handle).sort()).toEqual(['tee-1', 'tee-2']);
      expect(status()).toBe('ready');
    });

    it('never overwrites the account list when the read fails', async () => {
      fetchMock.mockResolvedValue(json({error: 'x'}, 500));
      mount(true);
      await flush();
      await click('add-a');
      await flush(60_000);
      expect(posts()).toHaveLength(0);
      expect(status()).toBe('error');
      expect(handles()).toBe('tee-1');
    });

    it('keeps a removal made during the slow read from being resurrected by the server list', async () => {
      let resolveGet: (r: Response) => void = () => {};
      fetchMock.mockImplementation((_url: string, init?: RequestInit) =>
        init?.method === 'POST'
          ? Promise.resolve(json({success: true}))
          : new Promise<Response>((resolve) => (resolveGet = resolve)),
      );
      mount(true);
      await flush();
      await click('remove-a');
      await act(async () => resolveGet(json({items: [entry(A), entry(B)]})));
      await flush(600);
      expect(handles()).toBe('tee-2');
    });

    it('surfaces a failed write, keeps the edit and retries', async () => {
      let writes = 0;
      fetchMock.mockImplementation((_url: string, init?: RequestInit) => {
        if (init?.method !== 'POST') return Promise.resolve(json({items: []}));
        writes += 1;
        return Promise.resolve(writes === 1 ? json({error: 'x'}, 500) : json({success: true}));
      });
      mount(true);
      await flush();
      await click('add-a');
      await flush(600);
      expect(status()).toBe('error');
      expect(handles()).toBe('tee-1');
      await flush(3_000);
      expect(writes).toBe(2);
      expect(status()).toBe('ready');
    });

    it('does not duplicate reads or writes under StrictMode', async () => {
      fetchMock.mockImplementation((_url: string, init?: RequestInit) =>
        Promise.resolve(init?.method === 'POST' ? json({success: true}) : json({items: [entry(B)]})),
      );
      mount(true, true);
      await flush(600);
      await click('add-a');
      await flush(600);
      expect(handles()).toBe('tee-2,tee-1');
      expect(posts().length).toBeLessThanOrEqual(2);
      const last = JSON.parse(String(posts().at(-1)![1].body));
      expect(last.items).toHaveLength(2);
    });

    it('does not put account items in browser storage and clears guest items after they sync', async () => {
      window.localStorage.setItem('lb_wishlist', JSON.stringify({items: [entry(A)], savedAt: Date.now()}));
      fetchMock.mockImplementation((_url: string, init?: RequestInit) =>
        Promise.resolve(init?.method === 'POST' ? json({success: true}) : json({items: [entry(B)]})),
      );
      mount(true);
      await flush(); // read resolves and React schedules the debounced write
      await flush(600);
      expect(posts()).toHaveLength(1);
      expect(handles().split(',').sort()).toEqual(['tee-1', 'tee-2']);
      expect(window.localStorage.getItem('lb_wishlist')).toBeNull();
    });

    it('drops the account list on logout instead of copying it to the guest list', async () => {
      fetchMock.mockImplementation((_url: string, init?: RequestInit) =>
        Promise.resolve(init?.method === 'POST' ? json({success: true}) : json({items: [entry(B)]})),
      );
      const {setLoggedIn} = mount(true);
      await flush(600);
      expect(handles()).toBe('tee-2');
      setLoggedIn(false);
      await flush(600);
      expect(handles()).toBe('');
      expect(window.localStorage.getItem('lb_wishlist')).toBeNull();
      expect(status()).toBe('guest');
    });

    it('keeps retrying a failed write past the old retry budget and recovers when the browser comes back online', async () => {
      let writes = 0;
      fetchMock.mockImplementation((_url: string, init?: RequestInit) => {
        if (init?.method !== 'POST') return Promise.resolve(json({items: []}));
        writes += 1;
        return Promise.resolve(writes <= 7 ? json({error: 'x'}, 500) : json({success: true}));
      });
      mount(true);
      await flush();
      await click('add-a');
      await flush(600);
      await flush(5 * 60_000); // far beyond the previous 5-attempt budget
      expect(writes).toBeGreaterThan(6);
      expect(status()).toBe('ready');
      expect(handles()).toBe('tee-1');
    });

    it('retries immediately when the browser reports it is back online', async () => {
      let ok = false;
      let writes = 0;
      fetchMock.mockImplementation((_url: string, init?: RequestInit) => {
        if (init?.method !== 'POST') return Promise.resolve(json({items: []}));
        writes += 1;
        return Promise.resolve(ok ? json({success: true}) : json({error: 'offline'}, 500));
      });
      mount(true);
      await flush();
      await click('add-a');
      await flush(600);
      expect(status()).toBe('error');
      const before = writes;
      ok = true;
      await act(async () => {
        window.dispatchEvent(new Event('online'));
      });
      await flush(10);
      expect(writes).toBe(before + 1);
      expect(status()).toBe('ready');
    });
  });

  describe('item limit', () => {
    const many = Array.from({length: 100}, (_, i) => ({id: `gid://shopify/Product/${i + 1}`, handle: i === 0 ? 'tee-1' : `p${i + 1}`, addedAt: 1000 + i}));

    it('refuses a 101st item instead of showing one that would be silently dropped', async () => {
      window.localStorage.setItem('lb_wishlist', JSON.stringify({items: many, savedAt: Date.now()}));
      mount(false);
      await flush();
      expect(handles().split(',')).toHaveLength(100);
      await click('add-overflow');
      expect(handles().split(',')).toHaveLength(100);
      expect(handles()).not.toContain('overflow');
      await click('toggle-overflow');
      expect(screen.getByTestId('toggle-result').textContent).toBe('full');
      // removing one makes room again
      await click('remove-a');
      await click('add-overflow');
      expect(handles()).toContain('overflow');
    });
  });
});
