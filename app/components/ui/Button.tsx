import {Link} from 'react-router';

type ButtonVariant = 'primary' | 'outline' | 'ghost' | 'dark';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonBaseProps {
  variant?: ButtonVariant;
  size?: ButtonSize;
  className?: string;
  children: React.ReactNode;
  disabled?: boolean;
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
  // Accent red pill — primary CTA
  primary:
    'bg-[var(--color-accent)] text-[var(--color-text-inverse)] border-[var(--color-accent)] hover:bg-[var(--color-accent-hover)] hover:border-[var(--color-accent-hover)] hover:-translate-y-px active:translate-y-0',
  // Off-black outline pill — fills on hover
  outline:
    'bg-transparent text-[var(--color-foreground)] border-[var(--color-foreground)] hover:bg-[var(--color-foreground)] hover:text-[var(--color-background)] hover:-translate-y-px active:translate-y-0',
  // Borderless text link style
  ghost:
    'bg-transparent text-[var(--color-foreground)] border-transparent hover:text-[var(--color-text-secondary)] underline-offset-4 hover:underline',
  // Solid dark pill — for dark CTAs on light backgrounds (checkout, etc.)
  dark:
    'bg-[var(--color-foreground)] text-[var(--color-text-inverse)] border-[var(--color-foreground)] hover:bg-[var(--color-border-medium)] hover:border-[var(--color-border-medium)] hover:-translate-y-px active:translate-y-0',
};

const SIZE_CLASSES: Record<ButtonSize, string> = {
  sm: 'px-5 py-2.5 text-[0.7rem]',
  md: 'px-7 py-3.5 text-[0.75rem]',
  lg: 'px-9 py-4 text-[0.8rem]',
};

const BASE =
  'inline-flex items-center justify-center gap-2 font-semibold tracking-[0.12em] uppercase border rounded-full transition-all duration-200 ease-[var(--ease-expo)] disabled:opacity-40 disabled:pointer-events-none disabled:transform-none select-none whitespace-nowrap';

/**
 * Shared button component — single source of truth for all CTA styles.
 *
 * Variants: primary (red), outline (bordered), ghost (text link), dark (solid black)
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
  ...rest
}: ButtonProps) {
  const classes = `${BASE} ${VARIANT_CLASSES[variant]} ${SIZE_CLASSES[size]} ${className}`;

  if (rest.as === 'link') {
    const {to} = rest as ButtonAsLinkProps;
    return (
      <Link to={to} className={classes}>
        {children}
      </Link>
    );
  }

  if (rest.as === 'a') {
    const {href, target, rel} = rest as ButtonAsAnchorProps;
    return (
      <a href={href} target={target} rel={rel} className={classes}>
        {children}
      </a>
    );
  }

  const {type = 'button', onClick} = rest as ButtonAsButtonProps;
  return (
    <button
      type={type}
      disabled={disabled}
      onClick={onClick}
      className={classes}
    >
      {children}
    </button>
  );
}
