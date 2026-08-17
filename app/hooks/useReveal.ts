import {useEffect, useRef} from 'react';

export function useReveal<T extends HTMLElement>(
  options: IntersectionObserverInit = {},
): React.RefObject<T> {
  const ref = useRef<T>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          el.classList.add('is-visible');
          observer.unobserve(el);
        }
      },
      {threshold: 0.15, rootMargin: '0px 0px -40px 0px', ...options},
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [options]);

  return ref;
}

export function useRevealChildren<T extends HTMLElement>(
  options: IntersectionObserverInit = {},
): React.RefObject<T> {
  const ref = useRef<T>(null);

  useEffect(() => {
    const container = ref.current;
    if (!container) return;

    const children = Array.from(container.children) as HTMLElement[];
    children.forEach((child) => child.classList.add('h-reveal'));

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          children.forEach((child) => child.classList.add('is-visible'));
          observer.unobserve(container);
        }
      },
      {threshold: 0.1, rootMargin: '0px 0px -20px 0px', ...options},
    );

    observer.observe(container);
    return () => observer.disconnect();
  }, [options]);

  return ref;
}
