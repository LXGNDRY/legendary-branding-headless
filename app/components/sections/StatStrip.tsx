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
  {value: '380–460GSM', label: 'Hoodies'},
  {value: '30 Days', label: 'Free Returns'},
  {value: 'Free Shipping', label: 'Orders $100+'},
];

/**
 * HANSSEN — Stat Strip Section
 * Editorial stat row with serif numbers and caps labels.
 */
export default function StatStrip({
  stats = DEFAULT_STATS,
  className = '',
  variant = 'light',
}: StatStripProps) {
  const bg = variant === 'dark' ? 'bg-[var(--color-foreground)] text-[var(--color-text-inverse)] border-[var(--color-border-medium)]' : 'bg-[var(--color-background)] text-[var(--color-foreground)] border-[var(--color-border-subtle)]';
  const valueColor = variant === 'dark' ? 'text-[var(--color-text-inverse)]' : 'text-[var(--color-foreground)]';
  const labelColor = variant === 'dark' ? 'text-[var(--color-text-tertiary)]' : 'text-[var(--color-text-secondary)]';

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
          <dd className={`text-[clamp(1.75rem,3vw,2.75rem)] font-serif leading-none mb-2 ${valueColor}`}>
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
