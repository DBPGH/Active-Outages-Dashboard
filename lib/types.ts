export type Severity = 'operational' | 'degraded' | 'partial_outage' | 'major_outage';

export interface IncidentUpdate {
  id: string;
  status: string;
  body: string;
  createdAt: string;
}

export interface Incident {
  id: string;
  name: string;
  status: string;
  impact: Severity;
  createdAt: string;
  updatedAt: string;
  affectedServices: string[];
  updates: IncidentUpdate[];
  url?: string;
}

export interface ProviderStatus {
  provider: string;
  slug: string;
  severity: Severity;
  activeCount: number;
  incidents: Incident[];
  lastUpdated: string;
  error?: string;
}

export const SEVERITY_CONFIG: Record<Severity, {
  label: string;
  textColor: string;
  bgColor: string;
  borderColor: string;
  dotColor: string;
  badgeBg: string;
}> = {
  operational: {
    label: 'Operational',
    textColor: 'text-emerald-400',
    bgColor: 'bg-emerald-500/10',
    borderColor: 'border-emerald-500/40',
    dotColor: 'bg-emerald-400',
    badgeBg: 'bg-emerald-500/20',
  },
  degraded: {
    label: 'Degraded',
    textColor: 'text-yellow-400',
    bgColor: 'bg-yellow-500/10',
    borderColor: 'border-yellow-500/40',
    dotColor: 'bg-yellow-400',
    badgeBg: 'bg-yellow-500/20',
  },
  partial_outage: {
    label: 'Partial Outage',
    textColor: 'text-orange-400',
    bgColor: 'bg-orange-500/10',
    borderColor: 'border-orange-500/40',
    dotColor: 'bg-orange-400',
    badgeBg: 'bg-orange-500/20',
  },
  major_outage: {
    label: 'Major Outage',
    textColor: 'text-red-400',
    bgColor: 'bg-red-500/10',
    borderColor: 'border-red-500/40',
    dotColor: 'bg-red-400',
    badgeBg: 'bg-red-500/20',
  },
};
