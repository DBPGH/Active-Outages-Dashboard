'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import IncidentCard from './IncidentCard';
import RefreshTimer from './RefreshTimer';
import ThemeToggle from './ThemeToggle';
import { ProviderStatus, SEVERITY_CONFIG } from '@/lib/types';

interface Props {
  slug: string;
  providerName: string;
  statusPageUrl: string;
  note?: string;
}

export default function ProviderDetailPage({ slug, providerName, statusPageUrl, note }: Props) {
  const [status, setStatus] = useState<ProviderStatus | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchStatus = useCallback(async () => {
    try {
      const res = await fetch(`/api/status/${slug}`);
      const data: ProviderStatus = await res.json();
      setStatus(data);
    } catch {
      // keep previous state on error
    } finally {
      setLoading(false);
    }
  }, [slug]);

  useEffect(() => { fetchStatus(); }, [fetchStatus]);

  const cfg = status ? SEVERITY_CONFIG[status.severity] : SEVERITY_CONFIG.operational;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-white">
      {/* Header */}
      <header className="border-b border-gray-200 dark:border-gray-800/60 bg-white/80 dark:bg-gray-950/80 backdrop-blur sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors text-sm flex items-center gap-1.5"
            >
              ← Dashboard
            </Link>
            <span className="text-gray-300 dark:text-gray-700">/</span>
            <div className="flex items-center gap-2">
              <span className="font-semibold">{providerName}</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <RefreshTimer interval={60} onRefresh={fetchStatus} lastUpdated={status?.lastUpdated} />
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-10">
        {/* Status summary */}
        {!loading && status && (
          <div className={`rounded-2xl border ${cfg.borderColor} ${cfg.bgColor} p-6 mb-8`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div>
                  <h1 className="text-xl font-bold text-gray-900 dark:text-white">{providerName}</h1>
                  <div className={`flex items-center gap-2 mt-1 ${cfg.textColor}`}>
                    <span className={`w-2 h-2 rounded-full ${cfg.dotColor} ${status.severity !== 'operational' ? 'animate-pulse' : ''}`} />
                    <span className="font-medium">{cfg.label}</span>
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className={`text-5xl font-bold ${cfg.textColor}`}>{status.activeCount}</div>
                <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  active {status.activeCount === 1 ? 'incident' : 'incidents'}
                </div>
              </div>
            </div>

            {status.error && (
              <div className="mt-4 p-3 rounded-lg bg-gray-100 dark:bg-gray-800/60 border border-gray-200 dark:border-gray-700/40 text-sm text-gray-500 dark:text-gray-400">
                ⚠ {status.error} —{' '}
                <a href={statusPageUrl} target="_blank" rel="noopener noreferrer" className="text-blue-500 dark:text-blue-400 hover:underline">
                  Check official status page ↗
                </a>
              </div>
            )}
            {note && (
              <div className="mt-3 p-3 rounded-lg bg-gray-100 dark:bg-gray-800/40 border border-gray-200 dark:border-gray-700/30 text-xs text-gray-500 flex items-start gap-2">
                <span className="mt-0.5 flex-shrink-0">ℹ</span>
                <span>{note}</span>
              </div>
            )}
          </div>
        )}

        {/* Loading skeleton */}
        {loading && (
          <div className="rounded-2xl border border-gray-200 dark:border-gray-700/50 bg-white dark:bg-gray-900/60 p-6 mb-8 animate-pulse">
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <div className="h-5 bg-gray-200 dark:bg-gray-700/60 rounded w-32 mb-2" />
                <div className="h-4 bg-gray-200 dark:bg-gray-700/40 rounded w-20" />
              </div>
            </div>
          </div>
        )}

        {/* Incidents */}
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
            Active Incidents
          </h2>
          <a
            href={statusPageUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-blue-500 dark:text-blue-400 hover:underline"
          >
            Official status page ↗
          </a>
        </div>

        {loading && (
          <div className="space-y-3">
            {[1, 2].map(i => (
              <div key={i} className="rounded-xl border border-gray-200 dark:border-gray-700/50 bg-white dark:bg-gray-900/60 p-4 animate-pulse">
                <div className="h-4 bg-gray-200 dark:bg-gray-700/60 rounded w-3/4 mb-2" />
                <div className="h-3 bg-gray-200 dark:bg-gray-700/40 rounded w-1/2" />
              </div>
            ))}
          </div>
        )}

        {!loading && status && status.incidents.length === 0 && (
          <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-8 text-center">
            <div className="text-3xl mb-3">✓</div>
            <p className="text-emerald-400 font-medium">No active incidents</p>
            <p className="text-sm text-gray-500 mt-1">{providerName} services are operating normally</p>
          </div>
        )}

        {!loading && status && status.incidents.length > 0 && (
          <div className="space-y-3">
            {status.incidents.map(incident => (
              <IncidentCard key={incident.id} incident={incident} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
