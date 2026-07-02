'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import RefreshTimer from '../components/RefreshTimer';
import ThemeToggle from '../components/ThemeToggle';
import { Severity, Incident, SEVERITY_CONFIG } from '@/lib/types';
import type { M365Service } from '../api/status/m365health/route';

interface M365HealthStatus {
  provider: string;
  slug: string;
  severity: Severity;
  activeCount: number;
  incidents: Incident[];
  allServices: M365Service[];
  lastUpdated: string;
  error?: string;
}

export default function M365HealthPage() {
  const [status, setStatus] = useState<M365HealthStatus | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchStatus = useCallback(async () => {
    try {
      const res = await fetch('/api/status/m365health');
      setStatus(await res.json());
    } catch {
      // keep previous state on error
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchStatus(); }, [fetchStatus]);

  const cfg = status ? SEVERITY_CONFIG[status.severity] : SEVERITY_CONFIG.operational;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-white">
      <header className="border-b border-gray-200 dark:border-gray-800/60 bg-white/80 dark:bg-gray-950/80 backdrop-blur sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <Link
              href="/"
              className="text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors text-sm flex items-center gap-1.5"
            >
              ← Dashboard
            </Link>
            <span className="text-gray-300 dark:text-gray-700">/</span>
            <span className="font-semibold">Microsoft Health</span>
          </div>
          <RefreshTimer interval={60} onRefresh={fetchStatus} lastUpdated={status?.lastUpdated} />
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-10">
        {/* Status summary */}
        {!loading && status && (
          <div className={`rounded-2xl border ${cfg.borderColor} ${cfg.bgColor} p-6 mb-8`}>
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-xl font-bold text-gray-900 dark:text-white">Microsoft Health</h1>
                <div className={`flex items-center gap-2 mt-1 ${cfg.textColor}`}>
                  <span className={`w-2 h-2 rounded-full ${cfg.dotColor} ${status.severity !== 'operational' ? 'animate-pulse' : ''}`} />
                  <span className="font-medium">{cfg.label}</span>
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
              <div className="mt-4 p-3 rounded-lg bg-gray-100 dark:bg-gray-800/60 border border-gray-200 dark:border-gray-700/40 text-sm text-gray-500">
                ⚠ {status.error} —{' '}
                <a href="https://status.cloud.microsoft" target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">
                  Check official status page ↗
                </a>
              </div>
            )}
          </div>
        )}

        {/* Loading skeleton */}
        {loading && (
          <div className="rounded-2xl border border-gray-200 dark:border-gray-700/50 bg-white dark:bg-gray-900/60 p-6 mb-8 animate-pulse">
            <div className="h-5 bg-gray-200 dark:bg-gray-700/60 rounded w-40 mb-2" />
            <div className="h-4 bg-gray-200 dark:bg-gray-700/40 rounded w-24" />
          </div>
        )}

        {/* Service health table */}
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
            Service Health
          </h2>
          <a
            href="https://status.cloud.microsoft"
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-blue-500 dark:text-blue-400 hover:underline"
          >
            Official status page ↗
          </a>
        </div>

        {loading && (
          <div className="rounded-xl border border-gray-200 dark:border-gray-700/50 bg-white dark:bg-gray-900/60 overflow-hidden">
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} className="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-gray-800/60 last:border-0 animate-pulse">
                <div className="h-4 bg-gray-200 dark:bg-gray-700/60 rounded w-48" />
                <div className="h-4 bg-gray-200 dark:bg-gray-700/40 rounded w-20" />
              </div>
            ))}
          </div>
        )}

        {!loading && status && status.allServices.length > 0 && (
          <div className="rounded-xl border border-gray-200 dark:border-gray-700/50 bg-white dark:bg-gray-900/60 overflow-hidden">
            <div className="divide-y divide-gray-100 dark:divide-gray-800/60">
              {status.allServices.map(svc => {
                const scfg = SEVERITY_CONFIG[svc.severity];
                return (
                  <div key={svc.workload} className="flex items-center justify-between px-4 py-3">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-gray-900 dark:text-white">{svc.name}</p>
                    </div>
                    <div className={`flex items-center gap-1.5 ml-4 flex-shrink-0 ${scfg.textColor}`}>
                      <span className={`w-2 h-2 rounded-full ${scfg.dotColor} ${svc.severity !== 'operational' ? 'animate-pulse' : ''}`} />
                      <span className="text-xs font-medium whitespace-nowrap">{scfg.label}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {!loading && status && status.allServices.length === 0 && !status.error && (
          <div className="rounded-xl border border-gray-200 dark:border-gray-700/50 bg-white dark:bg-gray-900/60 p-8 text-center text-sm text-gray-500">
            No service data available
          </div>
        )}

        <p className="text-xs text-gray-400 dark:text-gray-600 mt-4 text-center">
          Enterprise health reflects overall M365 tenant status · Consumer services from status.cloud.microsoft
        </p>
      </main>
    </div>
  );
}
