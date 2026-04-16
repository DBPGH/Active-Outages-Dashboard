'use client';

import Link from 'next/link';
import { ProviderStatus, SEVERITY_CONFIG } from '@/lib/types';

interface Props {
  status: ProviderStatus | null;
  loading: boolean;
  icon: React.ReactNode;
}

export default function ProviderCard({ status, loading, icon }: Props) {
  if (loading || !status) {
    return (
      <div className="relative rounded-xl border border-gray-700/50 bg-gray-900/60 p-4 animate-pulse">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-9 h-9 rounded-lg bg-gray-700/60" />
          <div className="flex-1">
            <div className="h-3.5 bg-gray-700/60 rounded w-20 mb-1.5" />
            <div className="h-3 bg-gray-700/40 rounded w-14" />
          </div>
        </div>
        <div className="h-8 bg-gray-700/40 rounded-lg" />
      </div>
    );
  }

  const cfg = SEVERITY_CONFIG[status.severity];

  return (
    <Link href={`/${status.slug}`} className="block group">
      <div
        className={`
          relative rounded-xl border p-4 transition-all duration-200 cursor-pointer
          bg-gray-900/60 hover:bg-gray-900/90
          ${cfg.borderColor}
          hover:shadow-lg hover:scale-[1.02]
        `}
      >
        {/* Subtle glow on non-operational */}
        {status.severity !== 'operational' && (
          <div className={`absolute inset-0 rounded-xl ${cfg.bgColor} pointer-events-none`} />
        )}

        <div className="relative flex items-start justify-between mb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-gray-800 flex items-center justify-center text-lg border border-gray-700/50">
              {icon}
            </div>
            <div>
              <h2 className="text-white font-semibold text-sm leading-tight">{status.provider}</h2>
              <div className={`flex items-center gap-1.5 mt-0.5 ${cfg.textColor}`}>
                <span className={`inline-block w-1.5 h-1.5 rounded-full ${cfg.dotColor} ${status.severity !== 'operational' ? 'animate-pulse' : ''}`} />
                <span className="text-xs font-medium">{cfg.label}</span>
              </div>
            </div>
          </div>

          {/* Count badge */}
          <div className={`
            flex flex-col items-center justify-center min-w-[44px] h-11 rounded-lg
            ${cfg.badgeBg} border ${cfg.borderColor}
          `}>
            <span className={`text-xl font-bold leading-none ${cfg.textColor}`}>
              {status.activeCount}
            </span>
            <span className="text-xs text-gray-400 mt-0.5">
              {status.activeCount === 1 ? 'issue' : 'issues'}
            </span>
          </div>
        </div>

        {status.error && (
          <p className="relative text-xs text-gray-500 mt-1">⚠ {status.error}</p>
        )}

        {!status.error && status.incidents.length > 0 && (
          <div className="relative space-y-1 mt-1">
            {status.incidents.slice(0, 1).map(inc => (
              <div key={inc.id} className="flex items-center gap-2 text-xs">
                <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${SEVERITY_CONFIG[inc.impact].dotColor}`} />
                <span className="text-gray-300 truncate">{inc.name}</span>
              </div>
            ))}
            {status.incidents.length > 1 && (
              <p className="text-xs text-gray-500 pl-3.5">
                +{status.incidents.length - 1} more
              </p>
            )}
          </div>
        )}

        {!status.error && status.incidents.length === 0 && (
          <p className="relative text-xs text-gray-500">All systems normal</p>
        )}

        <div className="relative flex items-center justify-between mt-3 pt-2 border-t border-gray-700/40">
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
