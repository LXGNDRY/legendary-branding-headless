// @vitest-environment jsdom
import {act, cleanup, fireEvent, render, screen, within} from '@testing-library/react';
import {createRoutesStub} from 'react-router';
import '@testing-library/jest-dom/vitest';
import {afterEach, describe, expect, it, vi} from 'vitest';
import Header from './Header';

vi.mock('~/components/ui/Wishlist', () => ({useWishlist: () => ({count: 2})}));

const navCollections = [
  {id: '1', handle: 'all-products', title: 'All Products', url: '/collections/all-products'},
  {id: '2', handle: 'hoodies-jackets', title: 'Hoodies', url: '/collections/hoodies-jackets'},
  {id: '3', handle: 'marque-legendaire-luxury-streetwear', title: 'Marque Légendaire', url: '/collections/marque-legendaire-luxury-streetwear'},
];

function renderHeader(props: Partial<React.ComponentProps<typeof Header>> = {}) {
  const Stub = createRoutesStub([{path: '/', Component: () => <Header navCollections={navCollections} {...props} />}]);
  return render(<Stub initialEntries={['/']} />);
}

afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

describe('Header', () => {
  it('shows the icon-only logo (no wordmark) with the brand name as its accessible name', () => {
    renderHeader();
    const logos = screen.getAllByRole('link', {name: 'Legendary Branding'});
    expect(logos.length).toBeGreaterThan(0);
    for (const logo of logos) {
      expect(logo).toHaveAttribute('href', '/');
      expect(logo.textContent?.trim()).toBe('');
      expect(logo.querySelector('svg')).not.toBeNull();
    }
    expect(document.body.textContent).not.toMatch(/LEGENDARY/);
  });

  it('renders the main navigation with the Shop link first', () => {
    renderHeader();
    const nav = screen.getByRole('navigation', {name: 'Main'});
    const hrefs = within(nav).getAllByRole('link').map((a) => a.getAttribute('href'));
    expect(hrefs).toEqual(['/collections/all-products', '/collections', '/journal', '/policies/about']);
  });

  it('shows the cart count in the accessible name and opens the cart on click', () => {
    const onOpenCart = vi.fn();
    renderHeader({cartCount: 3, onOpenCart});
    fireEvent.click(screen.getByRole('button', {name: 'Cart (3 items)'}));
    expect(onOpenCart).toHaveBeenCalledOnce();
  });

  it('shows the wishlist count in the wishlist link name', () => {
    renderHeader();
    expect(screen.getByRole('link', {name: /wishlist.*\(2\)/i})).toHaveAttribute('href', '/wishlist');
  });

  it('has a plain Cart label when the cart is empty', () => {
    renderHeader({cartCount: 0});
    expect(screen.getByRole('button', {name: 'Cart'})).toBeInTheDocument();
  });

  it('hides the account link entirely when accounts are disabled', () => {
    renderHeader({accountsEnabled: false});
    expect(document.querySelector('a[href="/account"], a[href="/account/login"]')).toBeNull();
  });

  it('links to login when signed out and to the account when signed in', () => {
    renderHeader({accountsEnabled: true, isLoggedIn: false});
    expect(document.querySelector('a[href="/account/login"]')).not.toBeNull();
    cleanup();
    renderHeader({accountsEnabled: true, isLoggedIn: true});
    expect(document.querySelector('a[href="/account"]')).not.toBeNull();
  });

  it('opens the shop mega menu on hover, grouping the merchant collections, and closes it after leaving', () => {
    vi.useFakeTimers();
    renderHeader();
    const shop = within(screen.getByRole('navigation', {name: 'Main'})).getAllByRole('link')[0];
    fireEvent.mouseEnter(shop.parentElement as HTMLElement);
    expect(screen.getByText('Just Dropped')).toBeInTheDocument();
    expect(screen.getByText('Shop by Category')).toBeInTheDocument();
    expect(screen.getByText('Featured Collection')).toBeInTheDocument();
    expect(screen.getByRole('link', {name: /Hoodies/})).toHaveAttribute('href', '/collections/hoodies-jackets');
    fireEvent.mouseLeave(shop.parentElement as HTMLElement);
    act(() => {
      vi.advanceTimersByTime(200);
    });
    expect(screen.queryByText('Just Dropped')).toBeNull();
  });

  it('toggles the search panel and reflects it in aria-expanded', () => {
    renderHeader();
    const toggle = screen.getAllByRole('button').find((b) => b.getAttribute('aria-expanded') !== null && /search/i.test(b.getAttribute('aria-label') ?? '')) as HTMLElement;
    expect(toggle).toHaveAttribute('aria-expanded', 'false');
    fireEvent.click(toggle);
    expect(toggle).toHaveAttribute('aria-expanded', 'true');
    fireEvent.click(toggle);
    expect(toggle).toHaveAttribute('aria-expanded', 'false');
  });

  it('opens the mobile menu from the hamburger button', () => {
    renderHeader();
    const open = screen.getByRole('button', {name: 'Open menu'});
    expect(open).toHaveAttribute('aria-expanded', 'false');
    fireEvent.click(open);
    expect(open).toHaveAttribute('aria-expanded', 'true');
  });
});
