'use client';

import Link from 'next/link';
import { ProviderStatus, SEVERITY_CONFIG } from '@/lib/types';

interface Props {
  status: ProviderStatus | null;
  loading: boolean;
}

export default function ProviderCard({ status, loading }: Props) {
  if (loading || !status) {
    return (
      <div className="rounded-xl border border-gray-200 dark:border-gray-700/50 bg-white dark:bg-gray-900/60 p-4 animate-pulse">
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <div className="h-4 bg-gray-200 dark:bg-gray-700/60 rounded w-24 mb-2" />
            <div className="h-3 bg-gray-200 dark:bg-gray-700/40 rounded w-16" />
          </div>
          <div className="w-12 h-12 rounded-xl bg-gray-200 dark:bg-gray-700/40" />
        </div>
        <div className="h-3 bg-gray-200 dark:bg-gray-700/40 rounded w-full mb-3" />
        <div className="h-px bg-gray-200 dark:bg-gray-700/40 mb-2" />
        <div className="h-3 bg-gray-200 dark:bg-gray-700/30 rounded w-20" />
      </div>
    );
  }

  const cfg = SEVERITY_CONFIG[status.severity];

  return (
    <Link href={`/${status.slug}`} className="block group">
      <div
        className={`
          relative rounded-xl border p-4 transition-all duration-200
          bg-white dark:bg-gray-900/60 hover:bg-gray-50 dark:hover:bg-gray-900/90
          ${cfg.borderColor} hover:shadow-lg hover:scale-[1.02]
        `}
      >
        {status.severity !== 'operational' && (
          <div className={`absolute inset-0 rounded-xl ${cfg.bgColor} pointer-events-none`} />
        )}

        {/* Header row: name + status + badge */}
        <div className="relative flex items-start justify-between mb-3">
          <div>
            <h2 className="text-gray-900 dark:text-white font-semibold text-sm leading-tight">
              {status.provider}
            </h2>
            <div className={`flex items-center gap-1.5 mt-1 ${cfg.textColor}`}>
              <span className={`w-2 h-2 rounded-full flex-shrink-0 ${cfg.dotColor} ${status.severity !== 'operational' ? 'animate-pulse' : ''}`} />
              <span className="text-xs font-medium">{cfg.label}</span>
            </div>
          </div>

          <div className={`flex flex-col items-center justify-center w-12 h-12 rounded-xl flex-shrink-0 ${cfg.badgeBg} border ${cfg.borderColor}`}>
            <span className={`text-2xl font-bold leading-none ${cfg.textColor}`}>
              {status.activeCount}
            </span>
            <span className="text-[10px] text-gray-500 mt-0.5">
              {status.activeCount === 1 ? 'issue' : 'issues'}
            </span>
          </div>
        </div>

        {/* Body: incident preview or all-clear */}
        <div className="relative min-h-[2rem]">
          {status.error && (
            <p className="text-xs text-gray-500 truncate">⚠ {status.error}</p>
          )}
          {!status.error && status.incidents.length > 0 && (
            <div className="space-y-1">
              {status.incidents.slice(0, 1).map(inc => (
                <div key={inc.id} className="flex items-center gap-2 text-xs">
                  <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${SEVERITY_CONFIG[inc.impact].dotColor}`} />
                  <span className="text-gray-700 dark:text-gray-300 truncate">{inc.name}</span>
                </div>
              ))}
              {status.incidents.length > 1 && (
                <p className="text-xs text-gray-500 pl-3.5">+{status.incidents.length - 1} more</p>
              )}
            </div>
          )}
          {!status.error && status.incidents.length === 0 && (
            <p className="text-xs text-gray-500">All systems normal</p>
          )}
        </div>

        {/* Footer: timestamp + details link */}
        <div className="relative flex items-center justify-between mt-3 pt-2 border-t border-gray-200 dark:border-gray-700/40">
          <span className="text-xs text-gray-500">
            {new Date(status.lastUpdated).toLocaleTimeString()}
          </span>
          <span className={`text-xs font-medium ${cfg.textColor} group-hover:underline`}>
            Details →
          </span>
        </div>
      </div>
    </Link>
  );
}
