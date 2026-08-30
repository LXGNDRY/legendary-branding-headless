interface Stat {
  value: string;
  label: string;
}

interface StatStripProps {
  stats?: Stat[];
  className?: string;
  variant?: 'light' | 'dark';
}

const DEFAULT_STATS: Stat[] = [
  {value: '235GSM+', label: 'Fabric Weight'},
  {value: '380-460GSM', label: 'Hoodies'},
  {value: '30 Days', label: 'Free Returns'},
  {value: '$100+', label: 'Free Shipping'},
];

/**
 * ONYX — Stat Strip Section
 * Dark theme editorial stat row with serif numbers and caps labels.
 */
export default function StatStrip({
  stats = DEFAULT_STATS,
  className = '',
  variant = 'dark',
}: StatStripProps) {
  const bg = variant === 'dark'
    ? 'bg-[var(--color-bg-level-1)] text-[var(--color-text-primary)] border-[var(--color-border-muted)]'
    : 'bg-[var(--color-bg-level-0)] text-[var(--color-text-primary)] border-[var(--color-border-muted)]';
  const valueColor = 'text-[var(--color-text-primary)]';
  const labelColor = 'text-[var(--color-text-tertiary)]';

  return (
    <dl
      className={`flex flex-wrap border-y ${bg} ${className}`}
      role="list"
    >
      {stats.map((stat) => (
        <div
          key={stat.label}
          className="flex flex-col items-center justify-center px-6 md:px-10 py-10 flex-1 min-w-[140px] border-r border-inherit last:border-r-0"
          role="listitem"
        >
          <dd className={`text-[clamp(1.5rem,3vw,2.5rem)] font-serif leading-none mb-2 ${valueColor}`}>
            {stat.value}
          </dd>
          <dt className={`h-eyebrow ${labelColor}`}>
            {stat.label}
          </dt>
        </div>
      ))}
    </dl>
  );
}
