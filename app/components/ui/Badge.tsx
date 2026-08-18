import type {ReactNode} from 'react';

/**
 * ONYX x LEGENDARY — Badge
 *
 * Pill-shaped badges for product status indicators (dark theme).
 *
 * Variants:
 * - default: dark surface, light text
 * - sale: red accent background, white text
 * - new: dark surface, light text
 * - soldout: dark muted surface, muted text
 */

const variants = {
  default: 'bg-[var(--color-bg-level-3)] text-[var(--color-text-primary)] border border-[var(--color-border-medium)]',
  sale: 'bg-[var(--color-accent)] text-white',
  new: 'bg-[var(--color-bg-level-2)] text-[var(--color-text-primary)] border border-[var(--color-border-medium)]',
  soldout: 'bg-[var(--color-bg-level-2)] text-[var(--color-text-tertiary)] border border-[var(--color-border-muted)]',
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
      className={`inline-flex items-center justify-center px-2.5 py-1 text-[10px] font-semibold tracking-[0.1em] uppercase rounded-full ${variants[variant]} ${className}`}
    >
      {children}
    </span>
  );
}
