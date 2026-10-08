import {useStoreTrust} from '~/components/ui/TrustSignals';
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
  {value: '220GSM+', label: 'Fabric Weight'},
  {value: '380-460GSM', label: 'Hoodies'},
  {value: 'Free', label: 'Shipping, Every Order'},
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
  // NOTE: the returns stat comes from the store's refund policy (via the
  // root loader) so it can't contradict it; hidden when no window is stated.
  const {returnDays} = useStoreTrust();
  const shownStats = stats === DEFAULT_STATS && returnDays
    ? [...stats.slice(0, 2), {value: `${returnDays} Days`, label: 'Returns'}, ...stats.slice(2)]
    : stats;
  const bg = variant === 'dark'
    ? 'bg-[var(--color-bg-level-1)] text-[var(--color-text-primary)] border-[var(--color-border-muted)]'
    : 'bg-[var(--color-bg-level-0)] text-[var(--color-text-primary)] border-[var(--color-border-muted)]';
  const valueColor = 'text-[var(--color-text-primary)]';
  const labelColor = 'text-[var(--color-text-tertiary)]';

  return (
    <div
      className={`flex flex-wrap border-y ${bg} ${className}`}
      role="list"
    >
      {shownStats.map((stat) => (
        <div
          key={stat.label}
          className="flex flex-col items-center justify-center text-center px-6 md:px-10 py-10 flex-1 min-w-[140px] border-r border-inherit last:border-r-0"
          role="listitem"
        >
          <div className={`text-[clamp(1.5rem,3vw,2.5rem)] font-serif leading-none mb-2 ${valueColor}`}>
            {stat.value}
          </div>
          <div className={`h-eyebrow ${labelColor}`}>
            {stat.label}
          </div>
        </div>
      ))}
    </div>
  );
}
