'use client';

import { useCallback, useEffect, useState } from 'react';
import ProviderCard from './components/ProviderCard';
import RefreshTimer from './components/RefreshTimer';
import ThemeToggle from './components/ThemeToggle';
import StatusHistoryChart, { StatusSnapshot } from './components/StatusHistoryChart';
import { ProviderStatus, SEVERITY_CONFIG } from '@/lib/types';

const CORE_PROVIDERS   = ['aws', 'cloudflare', 'bandwidth', 'thread', 'connectwise', 'hatz', 'godaddy', 'networksolutions', '3cx'];
const ALL_PROVIDERS    = [...CORE_PROVIDERS];
const REFRESH_INTERVAL = 60;

const INITIAL_STATE = Object.fromEntries(ALL_PROVIDERS.map(p => [p, null])) as Record<string, ProviderStatus | null>;


export default function Dashboard() {
  const [statuses, setStatuses]   = useState<Record<string, ProviderStatus | null>>(INITIAL_STATE);
  const [loading, setLoading]     = useState(true);
  const [lastUpdated, setLastUpdated] = useState('');
  const [history, setHistory]     = useState<StatusSnapshot[]>([]);

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

    const fresh = Object.values(next).filter(Boolean) as ProviderStatus[];
    const snapshot: StatusSnapshot = {
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      operational:    fresh.filter(s => s.severity === 'operational').length,
      degraded:       fresh.filter(s => s.severity === 'degraded').length,
      partial_outage: fresh.filter(s => s.severity === 'partial_outage').length,
      major_outage:   fresh.filter(s => s.severity === 'major_outage').length,
    };
    setHistory(prev => [...prev.slice(-20), snapshot]);

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
            <div className={`w-2.5 h-2.5 rounded-full ${overallCfg.dotColor}`} />
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
          <div className={`rounded-xl border ${overallCfg.borderColor} ${overallCfg.bgColor} px-5 py-4 mb-4 flex items-center gap-6`}>
            <div className="flex items-center gap-3 shrink-0">
              <div className={`w-3 h-3 rounded-full ${overallCfg.dotColor} ${worstSeverity !== 'operational' ? 'animate-pulse' : ''}`} />
              <div>
                <p className={`font-semibold ${overallCfg.textColor}`}>{overallCfg.label}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {totalIssues === 0
                    ? 'All services operational'
                    : `${totalIssues} active ${totalIssues === 1 ? 'issue' : 'issues'}`}
                </p>
              </div>
            </div>
            <div className="flex-1 h-24">
              <StatusHistoryChart data={history} />
            </div>
          </div>
        )}

        {/* Providers */}
        <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
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
