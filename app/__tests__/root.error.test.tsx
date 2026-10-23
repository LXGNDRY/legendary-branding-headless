// @vitest-environment jsdom
import {cleanup, render, screen} from '@testing-library/react';
import {createRoutesStub, useRouteError} from 'react-router';
import '@testing-library/jest-dom/vitest';
import {afterEach, describe, expect, it, vi} from 'vitest';

const captureError = vi.hoisted(() => vi.fn());
vi.mock('~/lib/monitoring', async (importOriginal) => ({
  ...(await importOriginal<typeof import('~/lib/monitoring')>()),
  captureError,
}));

import {ErrorBoundary} from '~/root';

function renderBoundary(error: unknown) {
  function Boundary() {
    return <ErrorBoundary error={useRouteError()} />;
  }
  const Stub = createRoutesStub([
    {
      path: '/',
      Component: () => null,
      ErrorBoundary: Boundary,
      loader: () => {
        throw error;
      },
    },
  ]);
  return render(<Stub initialEntries={['/']} />);
}

afterEach(() => {
  cleanup();
  captureError.mockClear();
});

describe('root ErrorBoundary', () => {
  it('shows the not-found page for a 404 route error', async () => {
    renderBoundary(new Response('missing', {status: 404}));
    expect(await screen.findByText('Lost.')).toBeInTheDocument();
    expect(screen.getByText('404 — Not Found')).toBeInTheDocument();
    expect(screen.getByRole('link', {name: 'Back to Home'})).toHaveAttribute('href', '/');
    expect(screen.getByRole('link', {name: 'Shop All'})).toHaveAttribute('href', '/collections/all-products');
  });

  it('shows a generic failure for any other error without leaking its message or stack', async () => {
    renderBoundary(new Error('database password is hunter2'));
    expect(await screen.findByText('Oops.')).toBeInTheDocument();
    expect(screen.queryByText(/hunter2/)).toBeNull();
    expect(document.body.textContent).not.toMatch(/at .*\(.*:\d+:\d+\)/);
  });

  it('reports the error with its route on the client', async () => {
    const error = new Error('boom');
    renderBoundary(error);
    await screen.findByText('Oops.');
    expect(captureError).toHaveBeenCalledWith(error, {route: '/'});
  });
});
