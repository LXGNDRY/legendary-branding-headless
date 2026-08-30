import {Link} from 'react-router';

type ButtonVariant = 'primary' | 'outline' | 'ghost' | 'dark';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonBaseProps {
  variant?: ButtonVariant;
  size?: ButtonSize;
  className?: string;
  children: React.ReactNode;
  disabled?: boolean;
  loading?: boolean;
  testId?: string;
  ariaLabel?: string;
}

interface ButtonAsButtonProps extends ButtonBaseProps {
  as?: 'button';
  type?: 'button' | 'submit' | 'reset';
  onClick?: React.MouseEventHandler<HTMLButtonElement>;
  to?: never;
  href?: never;
}

interface ButtonAsLinkProps extends ButtonBaseProps {
  as: 'link';
  to: string;
  type?: never;
  onClick?: never;
  href?: never;
}

interface ButtonAsAnchorProps extends ButtonBaseProps {
  as: 'a';
  href: string;
  type?: never;
  onClick?: never;
  to?: never;
  target?: string;
  rel?: string;
}

type ButtonProps = ButtonAsButtonProps | ButtonAsLinkProps | ButtonAsAnchorProps;

const VARIANT_CLASSES: Record<ButtonVariant, string> = {
  // Accent red pill — primary CTA (dark theme)
  primary:
    'bg-[var(--color-accent)] text-white border-[var(--color-accent)] hover:bg-[var(--color-accent-hover)] hover:border-[var(--color-accent-hover)] hover:-translate-y-px hover:shadow-[0_8px_24px_rgba(230,57,54,0.25)] active:translate-y-0 active:bg-[var(--color-accent-pressed)] active:border-[var(--color-accent-pressed)]',
  // Outline pill — secondary CTA on dark backgrounds
  outline:
    'bg-transparent text-[var(--color-text-primary)] border-[var(--color-border-medium)] hover:bg-[var(--color-bg-level-3)] hover:border-[var(--color-border-strong)] hover:text-[var(--color-text-primary)] hover:-translate-y-px active:translate-y-0',
  // Borderless text link style
  ghost:
    'bg-transparent text-[var(--color-text-primary)] border-transparent hover:text-[var(--color-accent)]',
  // Solid dark pill — for dark CTAs on light backgrounds
  dark:
    'bg-[var(--color-bg-level-4)] text-[var(--color-text-primary)] border-[var(--color-border-medium)] hover:bg-[var(--color-bg-level-3)] hover:border-[var(--color-border-strong)] hover:-translate-y-px active:translate-y-0',
};

const SIZE_CLASSES: Record<ButtonSize, string> = {
  sm: 'px-5 py-2.5 text-[0.7rem]',
  md: 'px-7 py-3.5 text-[0.75rem]',
  lg: 'px-9 py-4 text-[0.8rem]',
};

const BASE =
  'inline-flex items-center justify-center gap-2 font-semibold tracking-[0.14em] uppercase border rounded-full transition-all duration-200 ease-[var(--ease-expo)] disabled:opacity-40 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none select-none whitespace-nowrap';

/**
 * Shared button component — single source of truth for all CTA styles.
 *
 * Variants: primary (accent red), outline (bordered), ghost (text), dark (solid dark)
 * Sizes: sm, md, lg
 *
 * Use as a button, a React Router link (as="link"), or an external anchor (as="a").
 * For form submissions, use as="button" with type="submit".
 */
export default function Button({
  variant = 'primary',
  size = 'md',
  className = '',
  children,
  disabled,
  loading,
  testId,
  ariaLabel,
  ...rest
}: ButtonProps) {
  const isDisabled = disabled || loading;
  const classes = `${BASE} ${VARIANT_CLASSES[variant]} ${SIZE_CLASSES[size]} ${className}`;

  const content = (
    <>
      {loading && (
        <span
          className="inline-block h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent"
          aria-hidden="true"
        />
      )}
      {children}
    </>
  );

  if (rest.as === 'link') {
    const {to} = rest as ButtonAsLinkProps;
    return (
      <Link to={to} className={classes} aria-disabled={isDisabled} aria-label={ariaLabel} data-testid={testId}>
        {content}
      </Link>
    );
  }

  if (rest.as === 'a') {
    const {href, target, rel} = rest as ButtonAsAnchorProps;
    return (
      <a href={href} target={target} rel={rel} className={classes} aria-disabled={isDisabled} aria-label={ariaLabel} data-testid={testId}>
        {content}
      </a>
    );
  }

  const {type = 'button', onClick} = rest as ButtonAsButtonProps;
  return (
    <button
      type={type}
      disabled={isDisabled}
      onClick={onClick}
      className={classes}
      aria-busy={loading || undefined}
      aria-label={ariaLabel}
      data-testid={testId}
    >
      {content}
    </button>
  );
}
