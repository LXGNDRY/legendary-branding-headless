import {Link} from 'react-router';

type ButtonVariant = 'solid' | 'outline' | 'ghost';
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
}

interface ButtonAsLinkProps extends ButtonBaseProps {
  as: 'link';
  to: string;
  type?: never;
  onClick?: never;
}

type ButtonProps = ButtonAsButtonProps | ButtonAsLinkProps;

/**
 * Legendary Branding button — editorial streetwear style
 * Thin border, fill-on-hover for outline, Bebas Neue aesthetic spacing
 */
const VARIANT_CLASSES: Record<ButtonVariant, string> = {
  solid:
    'bg-black text-white border-black hover:opacity-90 hover:-translate-y-px active:translate-y-0',
  outline:
    'bg-transparent text-black border-black hover:bg-black hover:text-white',
  ghost:
    'bg-transparent text-black border-transparent hover:border-black',
};

const SIZE_CLASSES: Record<ButtonSize, string> = {
  sm: 'px-[18px] py-[10px] text-[0.78rem]',
  md: 'px-7 py-[14px] text-[0.85rem]',
  lg: 'px-9 py-[18px] text-[0.95rem]',
};

const BASE =
  'inline-flex items-center justify-center gap-2 font-medium tracking-[0.08em] uppercase border transition-all duration-[300ms] ease-[cubic-bezier(0.16,1,0.3,1)] disabled:opacity-40 disabled:pointer-events-none disabled:transform-none select-none';

export default function Button({
  variant = 'solid',
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
