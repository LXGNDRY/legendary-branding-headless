type BadgeVariant = 'default' | 'sale' | 'new' | 'soldout';

interface BadgeProps {
  variant?: BadgeVariant;
  children: React.ReactNode;
  className?: string;
}

const VARIANT_CLASSES: Record<BadgeVariant, string> = {
  default: 'bg-[#f7f7f7] text-[#0a0a0a]',
  sale: 'bg-[#0a0a0a] text-white',
  new: 'bg-[#0a0a0a] text-white',
  soldout: 'bg-[#e5e5e5] text-[#6b6b6b]',
};

export default function Badge({
  variant = 'default',
  children,
  className = '',
}: BadgeProps) {
  return (
    <span
      className={`inline-block text-[10px] font-semibold tracking-widest uppercase px-2 py-0.5 ${VARIANT_CLASSES[variant]} ${className}`}
    >
      {children}
    </span>
  );
}
