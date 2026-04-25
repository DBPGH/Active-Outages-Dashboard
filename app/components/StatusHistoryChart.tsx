'use client';

import {
  LineChart, Line, XAxis, YAxis, Tooltip,
  ResponsiveContainer, Legend,
} from 'recharts';

export interface StatusSnapshot {
  time: string;
  operational: number;
  degraded: number;
  partial_outage: number;
  major_outage: number;
}

interface Props {
  data: StatusSnapshot[];
}

const LINES = [
  { key: 'operational',   color: '#34d399', label: 'Operational'    },
  { key: 'degraded',      color: '#fbbf24', label: 'Degraded'       },
  { key: 'partial_outage',color: '#fb923c', label: 'Partial Outage' },
  { key: 'major_outage',  color: '#f87171', label: 'Major Outage'   },
] as const;

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 text-xs shadow-lg">
      <p className="text-gray-500 dark:text-gray-400 mb-1">{label}</p>
      {payload.map((entry: any) => (
        <p key={entry.dataKey} style={{ color: entry.color }}>
          {entry.name}: {entry.value}
        </p>
      ))}
    </div>
  );
}

export default function StatusHistoryChart({ data }: Props) {
  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-xs text-gray-400 dark:text-gray-600">
        Collecting data…
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={data} margin={{ top: 4, right: 8, left: -28, bottom: 0 }}>
        <XAxis
          dataKey="time"
          tick={{ fontSize: 10, fill: '#9ca3af' }}
          tickLine={false}
          axisLine={false}
        />
        <YAxis
          allowDecimals={false}
          tick={{ fontSize: 10, fill: '#9ca3af' }}
          tickLine={false}
          axisLine={false}
          width={36}
        />
        <Tooltip content={<CustomTooltip />} />
        <Legend
          iconType="circle"
          iconSize={6}
          wrapperStyle={{ fontSize: '10px', paddingTop: '4px' }}
        />
        {LINES.map(({ key, color, label }) => (
          <Line
            key={key}
            type="monotone"
            dataKey={key}
            name={label}
            stroke={color}
            strokeWidth={2}
            dot={data.length === 1 ? { r: 3, fill: color } : false}
            activeDot={{ r: 4 }}
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  );
}
