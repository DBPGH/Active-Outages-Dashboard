'use client';

import { useCallback, useEffect, useState } from 'react';
import Image from 'next/image';
import ProviderCard from './components/ProviderCard';
import RefreshTimer from './components/RefreshTimer';
import { ProviderStatus, SEVERITY_CONFIG } from '@/lib/types';

const CORE_PROVIDERS   = ['aws', 'cloudflare', 'bandwidth', 'teams', 'thread', 'connectwise', 'hatz'];
const ALL_PROVIDERS    = [...CORE_PROVIDERS];
const REFRESH_INTERVAL = 60;

const PROVIDER_ICONS: Record<string, React.ReactNode> = {
  aws:        <span>☁️</span>,
  cloudflare: <span>🌐</span>,
  bandwidth:  <span>📡</span>,
  teams:      <span>🪟</span>,
  thread:     <span>🧵</span>,
  connectwise: <span>🔧</span>,
  hatz:       <span>🤖</span>,
};

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
    <div className="min-h-screen bg-gray-950 text-white">
      <header className="border-b border-gray-800/60 bg-gray-950/80 backdrop-blur sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Image
              src="/PGH_Networks_Ver.png"
              alt="PGH Networks"
              width={120}
              height={120}
              className="object-contain"
              priority
            />
            <div className="flex items-center gap-3">
              <div className={`w-2.5 h-2.5 rounded-full ${overallCfg.dotColor} ${worstSeverity !== 'operational' ? 'animate-pulse' : ''}`} />
              <h1 className="text-lg font-semibold tracking-tight">Service Status Dashboard</h1>
            </div>
          </div>
          <RefreshTimer interval={REFRESH_INTERVAL} onRefresh={fetchAll} lastUpdated={lastUpdated} />
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-4">
        {/* Summary banner */}
        {!loading && (
          <div className={`rounded-xl border ${overallCfg.borderColor} ${overallCfg.bgColor} px-5 py-3 mb-4 flex items-center justify-between`}>
            <div className="flex items-center gap-3">
              <div className={`w-3 h-3 rounded-full ${overallCfg.dotColor} ${worstSeverity !== 'operational' ? 'animate-pulse' : ''}`} />
              <div>
                <p className={`font-semibold ${overallCfg.textColor}`}>{overallCfg.label}</p>
                <p className="text-sm text-gray-400">
                  {totalIssues === 0
                    ? 'All monitored services are operating normally'
                    : `${totalIssues} active ${totalIssues === 1 ? 'issue' : 'issues'} across monitored services`}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              {/* Legend */}
              <div className="hidden sm:flex flex-wrap gap-2">
                {(['operational', 'degraded', 'partial_outage', 'major_outage'] as const).map(s => {
                  const c = SEVERITY_CONFIG[s];
                  return (
                    <div key={s} className={`flex items-center gap-1.5 text-xs px-2 py-0.5 rounded-full border ${c.borderColor} ${c.bgColor}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${c.dotColor}`} />
                      <span className={c.textColor}>{c.label}</span>
                    </div>
                  );
                })}
              </div>
              <div className={`text-4xl font-bold ${overallCfg.textColor}`}>{totalIssues}</div>
            </div>
          </div>
        )}

        {/* Providers */}
        <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
          {CORE_PROVIDERS.map(slug => (
            <ProviderCard key={slug} status={statuses[slug]} loading={loading} icon={PROVIDER_ICONS[slug]} />
          ))}
        </div>

        <p className="text-center text-xs text-gray-600 mt-4">
          Data sourced from official provider status pages · Auto-refreshes every {REFRESH_INTERVAL}s
        </p>
      </main>
    </div>
  );
}
