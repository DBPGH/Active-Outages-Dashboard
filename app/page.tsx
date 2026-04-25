'use client';

import { useCallback, useEffect, useState } from 'react';
import ProviderCard from './components/ProviderCard';
import RefreshTimer from './components/RefreshTimer';
import ThemeToggle from './components/ThemeToggle';
import StatusInfographic from './components/StatusInfographic';
import { ProviderStatus, SEVERITY_CONFIG } from '@/lib/types';

const CORE_PROVIDERS   = ['aws', 'cloudflare', 'bandwidth', 'thread', 'connectwise', 'hatz', 'godaddy', 'networksolutions', '3cx', 'azure', 'teams', 'sharepoint'];
const ALL_PROVIDERS    = [...CORE_PROVIDERS];
const REFRESH_INTERVAL = 60;

const INITIAL_STATE = Object.fromEntries(ALL_PROVIDERS.map(p => [p, null])) as Record<string, ProviderStatus | null>;


export default function Dashboard() {
  const [statuses, setStatuses] = useState<Record<string, ProviderStatus | null>>(INITIAL_STATE);
  const [loading, setLoading]   = useState(true);
  const [lastUpdated, setLastUpdated] = useState('');

  const fetchAll = useCallback(async () => {
    const results = await Promise.allSettled(
      ALL_PROVIDERS.map(p =>
        fetch(`/api/status/${p}`).then(r => r.json() as Promise<ProviderStatus>)
      )
    );
    const next: Record<string, ProviderStatus | null> = {};
    results.forEach((result, i) => {
      next[ALL_PROVIDERS[i]] = result.status === 'fulfilled' ? result.value : null;
    });
    setStatuses(next);
    setLastUpdated(new Date().toISOString());
    setLoading(false);
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const allStatuses  = Object.values(statuses).filter(Boolean) as ProviderStatus[];
  const totalIssues  = allStatuses.reduce((sum, s) => sum + s.activeCount, 0);

  const worstSeverity = (() => {
    if (allStatuses.some(s => s.severity === 'major_outage'))   return 'major_outage';
    if (allStatuses.some(s => s.severity === 'partial_outage')) return 'partial_outage';
    if (allStatuses.some(s => s.severity === 'degraded'))       return 'degraded';
    return 'operational';
  })();

  const overallCfg = SEVERITY_CONFIG[worstSeverity];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-white">
      <header className="border-b border-gray-200 dark:border-gray-800/60 bg-white/80 dark:bg-gray-950/80 backdrop-blur sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h1 className="text-lg font-semibold tracking-tight">Service Status Dashboard</h1>
          </div>
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <RefreshTimer interval={REFRESH_INTERVAL} onRefresh={fetchAll} lastUpdated={lastUpdated} />
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-4">
        {/* Summary banner */}
        {!loading && (
          <div className="rounded-xl border border-gray-200 dark:border-gray-700/50 bg-white dark:bg-gray-900/60 px-5 py-4 mb-4">
            <div>
              <StatusInfographic
                operational={allStatuses.filter(s => s.severity === 'operational').length}
                degraded={allStatuses.filter(s => s.severity === 'degraded').length}
                partial_outage={allStatuses.filter(s => s.severity === 'partial_outage').length}
                major_outage={allStatuses.filter(s => s.severity === 'major_outage').length}
                total={allStatuses.length}
              />
            </div>
          </div>
        )}

        {/* Providers */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {CORE_PROVIDERS.map(slug => (
            <ProviderCard key={slug} status={statuses[slug]} loading={loading} />
          ))}
        </div>

        <p className="text-center text-xs text-gray-400 dark:text-gray-600 mt-4">
          Data sourced from official provider status pages · Auto-refreshes every {REFRESH_INTERVAL}s
        </p>
      </main>
    </div>
  );
}
