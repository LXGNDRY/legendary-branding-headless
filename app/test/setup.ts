import {beforeEach, vi} from 'vitest';

// NOTE: unit tests must be hermetic. Any test that needs fetch mocks it itself (vi.stubGlobal/spyOn overrides this);
// an unmocked call fails loudly instead of silently reaching a real provider.
beforeEach(() => {
  vi.stubGlobal(
    'fetch',
    vi.fn((input: RequestInfo | URL) => {
      const url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url;
      return Promise.reject(new Error(`Unmocked network call in unit test: ${url}`));
    }),
  );
});
