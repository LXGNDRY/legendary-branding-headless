import {useEffect, useRef} from 'react';

type RevealTuning = {threshold: number; rootMargin: string};

const SECTION: RevealTuning = {threshold: 0.15, rootMargin: '0px 0px -40px 0px'};
const CHILDREN: RevealTuning = {threshold: 0.1, rootMargin: '0px 0px -20px 0px'};

// NOTE: content is visible by default. Elements are only hidden (data-reveal="pending")
// after hydration, when IntersectionObserver exists, motion is allowed, and the element
// starts below the fold; without JS or those APIs nothing is ever hidden.
function canAnimate() {
  if (typeof IntersectionObserver === 'undefined') return false;
  if (typeof window.matchMedia !== 'function') return true;
  return !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

function isBelowFold(el: HTMLElement) {
  return el.getBoundingClientRect().top > window.innerHeight;
}

function observeReveal(
  trigger: HTMLElement,
  targets: HTMLElement[],
  {threshold, rootMargin}: RevealTuning,
): (() => void) | undefined {
  if (!canAnimate() || !isBelowFold(trigger)) return undefined;

  targets.forEach((t) => {
    t.classList.add('h-reveal');
    t.dataset.reveal = 'pending';
  });
  const reveal = () => {
    targets.forEach((t) => {
      t.classList.add('is-visible');
      delete t.dataset.reveal;
    });
  };

  const observer = new IntersectionObserver(
    ([entry]) => {
      if (entry.isIntersecting) {
        reveal();
        observer.disconnect();
      }
    },
    {threshold, rootMargin},
  );
  observer.observe(trigger);

  return () => {
    observer.disconnect();
    reveal();
  };
}

export function useReveal<T extends HTMLElement>(): React.RefObject<T | null> {
  const ref = useRef<T>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    return observeReveal(el, [el], SECTION);
  }, []);

  return ref;
}

export function useRevealChildren<T extends HTMLElement>(): React.RefObject<T | null> {
  const ref = useRef<T>(null);

  useEffect(() => {
    const container = ref.current;
    if (!container) return;
    return observeReveal(container, Array.from(container.children) as HTMLElement[], CHILDREN);
  }, []);

  return ref;
}
