interface PlaceholderProps {
  /** Tailwind aspect ratio class, e.g. "aspect-square" or "aspect-[3/4]" */
  aspect?: string;
  label?: string;
  className?: string;
}

/**
 * Responsive image placeholder used everywhere product/campaign images will
 * eventually appear. Replaced with real <Image> components in later milestones.
 */
export default function Placeholder({
  aspect = 'aspect-[3/4]',
  label = 'Image',
  className = '',
}: PlaceholderProps) {
  return (
    <div
      className={`${aspect} w-full rounded-lg bg-[var(--color-surface)] flex items-center justify-center ${className}`}
      aria-label={label}
      role="img"
    >
      <span className="text-[10px] font-medium tracking-widest uppercase text-[var(--color-text-tertiary)] select-none">
        {label}
      </span>
    </div>
  );
}
