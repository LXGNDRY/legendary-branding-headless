import {useEffect, useRef, useCallback} from 'react';
import type {RefObject} from 'react';

/**
 * useFocusTrap — traps keyboard focus within a container element.
 *
 * When active, Tab / Shift+Tab cycle only through focusable elements
 * inside the container. Esc triggers the onEscape callback.
 *
 * Used for modals, mobile menus, and other overlays where focus
 * should not escape into the background content.
 */
export function useFocusTrap(
  active: boolean,
  onEscape?: () => void,
): {containerRef: RefObject<HTMLDivElement>} {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const previouslyFocusedRef = useRef<HTMLElement | null>(null);

  const FOCUSABLE_SELECTOR = [
    'a[href]',
    'button:not([disabled])',
    'input:not([disabled])',
    'select:not([disabled])',
    'textarea:not([disabled])',
    '[tabindex]:not([tabindex="-1"])',
    '[contenteditable="true"]',
  ].join(', ');

  const getFocusableElements = useCallback(() => {
    if (!containerRef.current) return [];
    return Array.from(
      containerRef.current.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR),
    ).filter((el) => !el.hasAttribute('disabled') && el.offsetParent !== null);
  }, [FOCUSABLE_SELECTOR]);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (!active || !containerRef.current) return;

      // Escape
      if (e.key === 'Escape') {
        e.preventDefault();
        onEscape?.();
        return;
      }

      // Tab
      if (e.key === 'Tab') {
        const focusable = getFocusableElements();
        if (focusable.length === 0) return;

        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        const active = document.activeElement as HTMLElement | null;

        if (e.shiftKey) {
          // Shift+Tab: if at first, wrap to last
          if (active === first || !containerRef.current.contains(active)) {
            e.preventDefault();
            last.focus();
          }
        } else {
          // Tab: if at last, wrap to first
          if (active === last || !containerRef.current.contains(active)) {
            e.preventDefault();
            first.focus();
          }
        }
      }
    },
    [active, onEscape, getFocusableElements],
  );

  useEffect(() => {
    if (!active) return;

    // Save previously focused element to restore later
    previouslyFocusedRef.current = document.activeElement as HTMLElement | null;

    // Focus the first focusable element
    setTimeout(() => {
      const focusable = getFocusableElements();
      if (focusable.length > 0) {
        focusable[0].focus();
      }
    }, 10);

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      // Restore focus
      previouslyFocusedRef.current?.focus?.();
    };
  }, [active, handleKeyDown, getFocusableElements]);

  return {
    containerRef,
  };
}
