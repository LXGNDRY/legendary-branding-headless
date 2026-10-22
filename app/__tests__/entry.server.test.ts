import {afterEach, describe, expect, it, vi} from 'vitest';

const reported: Array<{error: unknown; options?: Record<string, unknown>}> = [];
vi.mock('~/lib/sentry.server', () => ({
  captureServerError: (error: unknown, options?: Record<string, unknown>) => reported.push({error, options}),
}));

const render = vi.hoisted(() => ({
  impl: null as null | ((options: {onError: (error: unknown) => void}) => void),
}));
vi.mock('react-dom/server', () => ({
  renderToReadableStream: async (_el: unknown, options: {onError: (error: unknown) => void}) => {
    render.impl?.(options);
    return Object.assign(new ReadableStream(), {allReady: Promise.resolve()});
  },
}));

import handleRequest, {handleError} from '~/entry.server';

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

describe('entry.server render errors', () => {
  afterEach(() => {
    reported.length = 0;
    render.impl = null;
  });

  const respond = (afterShell?: (onError: (error: unknown) => void) => void) => {
    let captured: ((error: unknown) => void) | undefined;
    render.impl = ({onError}) => {
      captured = onError;
    };
    return handleRequest(
      new Request('http://localhost/'),
      200,
      new Headers(),
      {} as Parameters<typeof handleRequest>[3],
    ).then((response) => {
      afterShell?.(captured!);
      return response;
    });
  };

  it('leaves shell-render errors to React Router so one failure is one report', async () => {
    let captured: ((error: unknown) => void) | undefined;
    render.impl = ({onError}) => {
      captured = onError;
      onError(new Error('shell failed'));
    };
    const response = await handleRequest(new Request('http://localhost/'), 200, new Headers(), {} as Parameters<typeof handleRequest>[3]);
    expect(captured).toBeDefined();
    expect(reported).toHaveLength(0);
    expect(response.status).toBe(500);
  });

  it('reports errors raised while streaming after the shell rendered', async () => {
    const error = new Error('suspense boundary failed');
    await respond((onError) => onError(error));
    expect(reported).toHaveLength(1);
    expect(reported[0].options).toMatchObject({extra: {source: 'render'}});
  });
});
