// @vitest-environment jsdom
import {describe, expect, it} from 'vitest';
import {render} from '@testing-library/react';
import {createMemoryRouter, RouterProvider} from 'react-router';
import LocaleLink from './LocaleLink';

function renderAt(pathname: string, to: Parameters<typeof LocaleLink>[0]['to']) {
  const router = createMemoryRouter(
    [
      {
        path: '*',
        element: (
          <LocaleLink to={to} data-testid="link">
            x
          </LocaleLink>
        ),
      },
    ],
    {initialEntries: [pathname]},
  );
  return render(<RouterProvider router={router} />);
}

describe('LocaleLink', () => {
  it('prefixes site-relative paths with the active locale slug', () => {
    const {getByTestId} = renderAt('/de/products/foo', '/products/bar');
    expect(getByTestId('link').getAttribute('href')).toBe('/de/products/bar');
  });

  it('leaves paths unchanged for the default (EN) locale at root', () => {
    const {getByTestId} = renderAt('/products/foo', '/products/bar');
    expect(getByTestId('link').getAttribute('href')).toBe('/products/bar');
  });

  it('does not double-prefix a path that already carries a locale slug', () => {
    const {getByTestId} = renderAt('/de/products/foo', '/de/collections/all-products');
    expect(getByTestId('link').getAttribute('href')).toBe('/de/collections/all-products');
  });

  it('leaves absolute URLs unchanged', () => {
    const {getByTestId} = renderAt('/de/products/foo', 'https://example.com/x');
    expect(getByTestId('link').getAttribute('href')).toBe('https://example.com/x');
  });

  it('maps the DE home link to /de (no trailing slash)', () => {
    const {getByTestId} = renderAt('/de/products/foo', '/');
    expect(getByTestId('link').getAttribute('href')).toBe('/de');
  });

  it('handles pt-br as a multi-segment slug', () => {
    const {getByTestId} = renderAt('/pt-br/journal', '/products/x');
    expect(getByTestId('link').getAttribute('href')).toBe('/pt-br/products/x');
  });
});
