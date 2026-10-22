// @vitest-environment jsdom
import {act, cleanup, fireEvent, render, screen} from '@testing-library/react';
import {useState} from 'react';
import {afterEach, describe, expect, it, vi} from 'vitest';
import {useFocusTrap} from '~/hooks/useFocusTrap';
import {overlayDepth, resetOverlayStack} from '~/lib/overlay-stack';

function Overlay({name, open, onClose, z, children}: {name: string; open: boolean; onClose: () => void; z?: number; children?: React.ReactNode}) {
  const {containerRef} = useFocusTrap(open, onClose);
  if (!open) return null;
  return (
    <div style={z === undefined ? undefined : {position: 'fixed', zIndex: z}}>
      <div data-testid={`${name}-scrim`} data-overlay-keep />
      <div ref={containerRef} role="dialog" aria-modal="true" aria-label={name}>
        <button type="button">{name} first</button>
        <button type="button">{name} last</button>
        {children}
      </div>
    </div>
  );
}

function Page({initialCart = false, initialPopup = false, cartZ, popupZ}: {initialCart?: boolean; initialPopup?: boolean; cartZ?: number; popupZ?: number}) {
  const [cart, setCart] = useState(initialCart);
  const [popup, setPopup] = useState(initialPopup);
  return (
    <div id="app">
      <header>
        <button type="button" onClick={() => setCart(true)}>open cart</button>
        <button type="button" onClick={() => setPopup(true)}>open popup</button>
      </header>
      <main>
        <a href="/x">page link</a>
      </main>
      <Overlay name="cart" open={cart} onClose={() => setCart(false)} z={cartZ} />
      <Overlay name="popup" open={popup} onClose={() => setPopup(false)} z={popupZ} />
    </div>
  );
}

afterEach(() => {
  cleanup();
  resetOverlayStack();
  vi.useRealTimers();
});

const settle = () => act(async () => {
  await new Promise((resolve) => setTimeout(resolve, 30));
});

describe('overlay stack', () => {
  it('makes the rest of the page inert while an overlay is open, and restores it on close', async () => {
    render(<Page />);
    const main = document.querySelector('main')!;
    const header = document.querySelector('header')!;
    expect(main.hasAttribute('inert')).toBe(false);

    fireEvent.click(screen.getByText('open cart'));
    await settle();
    expect(main.hasAttribute('inert')).toBe(true);
    expect(header.hasAttribute('inert')).toBe(true);
    // the overlay itself and its scrim stay interactive
    expect(screen.getByRole('dialog', {name: 'cart'}).closest('[inert]')).toBeNull();
    expect(screen.getByTestId('cart-scrim').closest('[inert]')).toBeNull();

    fireEvent.keyDown(document, {key: 'Escape'});
    await settle();
    expect(main.hasAttribute('inert')).toBe(false);
    expect(header.hasAttribute('inert')).toBe(false);
    expect(overlayDepth()).toBe(0);
  });

  it('only the topmost overlay answers Escape, and closing it hands the page back to the one beneath', async () => {
    render(<Page initialCart />);
    await settle();
    fireEvent.click(screen.getByText('open popup'));
    await settle();
    expect(overlayDepth()).toBe(2);
    // the cart is beneath the popup: inert while the popup is on top
    expect(screen.getByRole('dialog', {name: 'cart', hidden: true}).closest('[inert]')).not.toBeNull();

    fireEvent.keyDown(document, {key: 'Escape'});
    await settle();
    // one Escape closed only the popup
    expect(screen.queryByRole('dialog', {name: 'popup'})).toBeNull();
    expect(screen.getByRole('dialog', {name: 'cart'})).toBeTruthy();
    expect(screen.getByRole('dialog', {name: 'cart'}).closest('[inert]')).toBeNull();
    expect(document.querySelector('main')!.hasAttribute('inert')).toBe(true);

    fireEvent.keyDown(document, {key: 'Escape'});
    await settle();
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(document.querySelector('main')!.hasAttribute('inert')).toBe(false);
  });

  it('keeps the visually highest overlay on top even when a lower one opens after it', async () => {
    // popup is drawn at z 600, the cart at 500: the cart opening later must not take over
    render(<Page initialPopup cartZ={500} popupZ={600} />);
    await settle();
    fireEvent.click(screen.getByText('open cart'));
    await settle();
    expect(overlayDepth()).toBe(2);
    // the visible popup stays interactive; the cart beneath it is the inert one
    expect(screen.getByRole('dialog', {name: 'popup'}).closest('[inert]')).toBeNull();
    expect(screen.getByRole('dialog', {name: 'cart', hidden: true}).closest('[inert]')).not.toBeNull();

    // Escape closes the popup (the visible one), not the cart
    fireEvent.keyDown(document, {key: 'Escape'});
    await settle();
    expect(screen.queryByRole('dialog', {name: 'popup'})).toBeNull();
    expect(screen.getByRole('dialog', {name: 'cart'})).toBeTruthy();
    expect(screen.getByRole('dialog', {name: 'cart'}).closest('[inert]')).toBeNull();
  });

  it('orders overlays at the same level by when they opened', async () => {
    render(<Page initialCart cartZ={500} popupZ={500} />);
    await settle();
    fireEvent.click(screen.getByText('open popup'));
    await settle();
    expect(screen.getByRole('dialog', {name: 'popup'}).closest('[inert]')).toBeNull();
    expect(screen.getByRole('dialog', {name: 'cart', hidden: true}).closest('[inert]')).not.toBeNull();
  });

  it('returns focus to the control that opened the overlay', async () => {
    render(<Page />);
    const opener = screen.getByText('open cart');
    opener.focus();
    fireEvent.click(opener);
    await settle();
    fireEvent.keyDown(document, {key: 'Escape'});
    await settle();
    expect(document.activeElement).toBe(opener);
  });

  it('never touches an element that was already inert', async () => {
    render(<Page />);
    const main = document.querySelector('main')!;
    main.setAttribute('inert', '');
    fireEvent.click(screen.getByText('open cart'));
    await settle();
    fireEvent.keyDown(document, {key: 'Escape'});
    await settle();
    expect(main.hasAttribute('inert')).toBe(true);
  });

  it('keeps focus where the user is typing across re-renders of the owner', async () => {
    function Typing() {
      const [text, setText] = useState('');
      const {containerRef} = useFocusTrap(true, () => {});
      return (
        <div>
          <p>{text.length} chars</p>
          <div ref={containerRef} role="dialog" aria-label="typing">
            <button type="button">first</button>
            <input aria-label="note" value={text} onChange={(e) => setText(e.target.value)} />
          </div>
        </div>
      );
    }
    render(<Typing />);
    await settle();
    const input = screen.getByLabelText('note');
    input.focus();
    for (const value of ['a', 'ab', 'abc']) fireEvent.change(input, {target: {value}});
    await settle();
    expect(document.activeElement).toBe(input);
  });
});
