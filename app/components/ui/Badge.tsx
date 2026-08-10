type BadgeVariant = 'default' | 'sale' | 'new' | 'soldout';

interface BadgeProps {
  variant?: BadgeVariant;
  children: React.ReactNode;
  className?: string;
}

/**
 * Legendary Branding badge — streetwear editorial style
 * Small pill with tight tracking, B&W palette
 */
const VARIANT_CLASSES: Record<BadgeVariant, string> = {
  default: 'bg-white text-black',
  sale: 'bg-black text-white',
  new: 'bg-black text-white',
  soldout: 'bg-black/80 text-white',
};

const BASE =
  'inline-block px-[10px] py-1 text-[0.65rem] font-semibold tracking-[0.1em] uppercase rounded-[2px]';

export default function Badge({
  variant = 'default',
  children,
  className = '',
}: BadgeProps) {
  return (
    <span className={`${BASE} ${VARIANT_CLASSES[variant]} ${className}`}>
      {children}
    </span>
  );
}
