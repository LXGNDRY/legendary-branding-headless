import type {ReactNode} from 'react';

/**
 * HANSSEN x LEGENDARY — Badge
 *
 * Pill-shaped badges for product status indicators.
 *
 * Variants:
 * - default: off-black background, white text
 * - sale: red accent background, white text
 * - new: off-black background, white text
 * - soldout: light gray background, dark text
 */

const variants = {
  default: 'bg-[var(--color-foreground)] text-[var(--color-text-inverse)]',
  sale: 'bg-[var(--color-accent)] text-[var(--color-text-inverse)]',
  new: 'bg-[var(--color-foreground)] text-[var(--color-text-inverse)]',
  soldout: 'bg-[var(--color-surface)] text-[var(--color-text-secondary)]',
} as const;

interface BadgeProps {
  variant?: keyof typeof variants;
  children: ReactNode;
  className?: string;
}

export default function Badge({
  variant = 'default',
  children,
  className = '',
}: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center justify-center px-2.5 py-1 text-[10px] font-medium tracking-[0.1em] uppercase rounded-full ${variants[variant]} ${className}`}
    >
      {children}
    </span>
  );
}
