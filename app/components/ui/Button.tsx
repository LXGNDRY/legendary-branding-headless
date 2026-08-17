import {Link} from 'react-router';

type ButtonVariant = 'primary' | 'outline' | 'ghost' | 'solid';
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

const VARIANT_CLASSES: Record<ButtonVariant, string> = {
  // Accent red pill — primary CTA
  primary:
    'bg-[#FF3B30] text-[#FAF9F6] border-[#FF3B30] rounded-full hover:bg-[#E0342A] hover:border-[#E0342A] hover:-translate-y-px active:translate-y-0',
  // Same as primary (legacy alias)
  solid:
    'bg-[#FF3B30] text-[#FAF9F6] border-[#FF3B30] rounded-full hover:bg-[#E0342A] hover:border-[#E0342A] hover:-translate-y-px active:translate-y-0',
  // Off-black outline pill
  outline:
    'bg-transparent text-[#1A1A1A] border-[#1A1A1A] rounded-full hover:bg-[#1A1A1A] hover:text-[#FAF9F6] hover:-translate-y-px active:translate-y-0',
  // Borderless text link style
  ghost:
    'bg-transparent text-[#1A1A1A] border-transparent hover:text-[#6B6B6B] underline-offset-4 hover:underline',
};

const SIZE_CLASSES: Record<ButtonSize, string> = {
  sm: 'px-5 py-2.5 text-[0.7rem]',
  md: 'px-7 py-3.5 text-[0.75rem]',
  lg: 'px-9 py-4 text-[0.8rem]',
};

const BASE =
  'inline-flex items-center justify-center gap-2 font-semibold tracking-[0.12em] uppercase border transition-all duration-200 ease-[cubic-bezier(0.16,1,0.3,1)] disabled:opacity-40 disabled:pointer-events-none disabled:transform-none select-none whitespace-nowrap';

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
