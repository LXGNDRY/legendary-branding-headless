interface Stat {
  value: string;
  label: string;
}

interface StatStripProps {
  stats?: Stat[];
  className?: string;
}

const DEFAULT_STATS: Stat[] = [
  {value: '235GSM+', label: 'FABRIC WEIGHT'},
  {value: '380–460GSM', label: 'HOODIES'},
  {value: '30 DAYS', label: 'FREE RETURNS'},
  {value: 'FREE SHIPPING', label: 'ORDERS $100+'},
];

export default function StatStrip({stats = DEFAULT_STATS, className = ''}: StatStripProps) {
  return (
    <dl
      className={`flex flex-wrap justify-center divide-x divide-[#e5e5e5] border-y border-[#e5e5e5] bg-white ${className}`}
      role="list"
    >
      {stats.map((stat) => (
        <div
          key={stat.label}
          className="flex flex-col items-center justify-center px-8 py-6 flex-1 min-w-[140px]"
          role="listitem"
        >
          <dd className="text-2xl md:text-3xl font-semibold tracking-tight text-[#0a0a0a] leading-none mb-1">
            {stat.value}
          </dd>
          <dt className="text-[9px] font-medium tracking-[0.18em] uppercase text-[#6b6b6b]">
            {stat.label}
          </dt>
        </div>
      ))}
    </dl>
  );
}
