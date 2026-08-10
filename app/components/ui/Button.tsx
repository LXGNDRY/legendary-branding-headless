import {Link} from 'react-router';

type ButtonVariant = 'primary' | 'ghost' | 'outline';

interface ButtonBaseProps {
  variant?: ButtonVariant;
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
  primary:
    'bg-[#0a0a0a] text-white hover:bg-[#333333] active:bg-[#555555]',
  ghost:
    'bg-transparent text-[#0a0a0a] hover:bg-[#f7f7f7] active:bg-[#e5e5e5]',
  outline:
    'border border-[#0a0a0a] text-[#0a0a0a] hover:bg-[#0a0a0a] hover:text-white active:bg-[#333333] active:text-white',
};

const BASE =
  'inline-flex items-center justify-center px-6 py-3 text-xs font-medium tracking-widest uppercase transition-colors duration-150 disabled:opacity-40 disabled:pointer-events-none';

export default function Button({
  variant = 'primary',
  className = '',
  children,
  disabled,
  ...rest
}: ButtonProps) {
  const classes = `${BASE} ${VARIANT_CLASSES[variant]} ${className}`;

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
