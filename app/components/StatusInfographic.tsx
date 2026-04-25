'use client';

interface Props {
  operational: number;
  degraded: number;
  partial_outage: number;
  major_outage: number;
  total: number;
}

const STATS = [
  {
    key: 'operational',
    label: 'Operational',
    numColor:   'text-emerald-500 dark:text-emerald-400',
    barColor:   'bg-emerald-400',
    borderColor:'border-emerald-500/30',
    bgColor:    'bg-emerald-500/10',
  },
  {
    key: 'degraded',
    label: 'Degraded',
    numColor:   'text-yellow-500 dark:text-yellow-400',
    barColor:   'bg-yellow-400',
    borderColor:'border-yellow-500/30',
    bgColor:    'bg-yellow-500/10',
  },
  {
    key: 'partial_outage',
    label: 'Partial Outage',
    numColor:   'text-orange-500 dark:text-orange-400',
    barColor:   'bg-orange-400',
    borderColor:'border-orange-500/30',
    bgColor:    'bg-orange-500/10',
  },
  {
    key: 'major_outage',
    label: 'Major Outage',
    numColor:   'text-red-500 dark:text-red-400',
    barColor:   'bg-red-400',
    borderColor:'border-red-500/30',
    bgColor:    '',
  },
] as const;

export default function StatusInfographic({ operational, degraded, partial_outage, major_outage, total }: Props) {
  const counts: Record<string, number> = { operational, degraded, partial_outage, major_outage };

  return (
    <div className="flex flex-col gap-2">
      <div className="grid grid-cols-4 gap-2">
        {STATS.map(s => (
          <div
            key={s.key}
            className={`rounded-lg border ${s.borderColor} ${s.bgColor} px-3 py-2.5 flex items-center gap-2.5`}
          >
            <span className={`text-3xl font-bold tabular-nums leading-none ${s.numColor}`}>
              {counts[s.key]}
            </span>
            <div className="flex flex-col min-w-0">
              <span className={`w-1.5 h-1.5 rounded-full ${s.barColor} mb-1 flex-shrink-0`} />
              <span className="text-xs text-gray-500 dark:text-gray-400 leading-tight whitespace-nowrap">
                {s.label}
              </span>
            </div>
          </div>
        ))}
      </div>

      {total > 0 && (
        <div className="flex rounded-full overflow-hidden h-1.5 bg-gray-200 dark:bg-gray-800">
          {STATS.map(s => {
            const pct = (counts[s.key] / total) * 100;
            if (pct === 0) return null;
            return (
              <div
                key={s.key}
                className={s.barColor}
                style={{ width: `${pct}%` }}
                title={`${s.label}: ${counts[s.key]}`}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}
