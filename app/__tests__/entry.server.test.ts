import {afterEach, describe, expect, it, vi} from 'vitest';

const reported: Array<{error: unknown; options?: Record<string, unknown>}> = [];
vi.mock('~/lib/sentry.server', () => ({
  captureServerError: (error: unknown, options?: Record<string, unknown>) => reported.push({error, options}),
}));

import {handleError} from '~/entry.server';

describe('entry.server handleError', () => {
  afterEach(() => {
    reported.length = 0;
  });

  const args = (request: Request) => ({request, params: {}, context: {}}) as Parameters<typeof handleError>[1];

  it('reports an error React Router handled itself, with the request and its origin', () => {
    const request = new Request('http://localhost/products/x');
    const error = new Error('loader failed');
    handleError(error, args(request));
    expect(reported).toHaveLength(1);
    expect(reported[0].error).toBe(error);
    expect(reported[0].options).toMatchObject({request, extra: {source: 'route'}});
  });

  it('ignores errors from a request the browser already abandoned', () => {
    const controller = new AbortController();
    controller.abort();
    handleError(new Error('aborted'), args(new Request('http://localhost/', {signal: controller.signal})));
    expect(reported).toHaveLength(0);
  });
});
