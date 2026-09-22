export function StarIcon({filled = true, size = 14}: {filled?: boolean; size?: number}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 14 14"
      fill={filled ? 'currentColor' : 'none'}
      stroke="currentColor"
      strokeWidth="1"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M7 1l1.8 3.6 4 .6-2.9 2.8.7 4-3.6-1.9L3.4 12l.7-4L1.2 5.2l4-.6L7 1z" />
    </svg>
  );
}

interface StarRatingProps {
  rating: number;
  count: number;
  size?: 'sm' | 'md';
  className?: string;
}

/** Real Judge.me rating + review count — never rendered without both. */
export default function StarRating({rating, count, size = 'md', className = ''}: StarRatingProps) {
  if (count <= 0) return null;

  const iconSize = size === 'sm' ? 11 : 14;
  const label = `${rating.toFixed(1)} out of 5 stars, based on ${count} ${count === 1 ? 'review' : 'reviews'}`;

  return (
    <div className={`flex items-center gap-1.5 text-[var(--color-accent)] ${className}`} role="img" aria-label={label}>
      <div className="flex gap-0.5" aria-hidden="true">
        {Array.from({length: 5}).map((_, i) => (
          <StarIcon key={i} filled={i < Math.round(rating)} size={iconSize} />
        ))}
      </div>
      <span className="text-xs text-[var(--color-text-tertiary)]" aria-hidden="true">({count})</span>
    </div>
  );
}
