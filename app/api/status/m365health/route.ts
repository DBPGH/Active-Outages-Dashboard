import { Severity, Incident } from '@/lib/types';

export interface M365Service {
  name: string;
  workload: string;
  status: string;
  severity: Severity;
  updatedAt: string;
}

// In-memory token cache — avoids a round-trip on every request
let cachedToken: { value: string; expiresAt: number } | null = null;

async function getAccessToken(): Promise<string> {
  const now = Date.now();
  if (cachedToken && cachedToken.expiresAt > now + 60_000) return cachedToken.value;

  const tenantId = process.env.MS_TENANT_ID;
  const clientId = process.env.MS_CLIENT_ID;
  const clientSecret = process.env.MS_CLIENT_SECRET;

  if (!tenantId || !clientId || !clientSecret) {
    throw new Error('MS_TENANT_ID, MS_CLIENT_ID, and MS_CLIENT_SECRET must be set');
  }

  const res = await fetch(
    `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'client_credentials',
        client_id: clientId,
        client_secret: clientSecret,
        scope: 'https://graph.microsoft.com/.default',
      }).toString(),
      cache: 'no-store',
    },
  );

  if (!res.ok) throw new Error(`Token request failed: HTTP ${res.status}`);
  const data = await res.json();

  cachedToken = { value: data.access_token, expiresAt: now + data.expires_in * 1000 };
  return cachedToken.value;
}

async function graphGet(path: string, token: string) {
  const res = await fetch(`https://graph.microsoft.com/v1.0${path}`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: 'no-store',
  });
  if (!res.ok) throw new Error(`Graph API ${path} failed: HTTP ${res.status}`);
  return res.json();
}

function mapStatus(status: string): Severity {
  switch (status) {
    case 'serviceInterruption':    return 'major_outage';
    case 'serviceDegradation':
    case 'extendedRecovery':       return 'partial_outage';
    case 'investigating':
    case 'restoringService':
    case 'verifyingService':
    case 'investigationSuspended': return 'degraded';
    default:                       return 'operational';
  }
}

function overallSeverity(services: M365Service[]): Severity {
  if (services.some(s => s.severity === 'major_outage'))   return 'major_outage';
  if (services.some(s => s.severity === 'partial_outage')) return 'partial_outage';
  if (services.some(s => s.severity === 'degraded'))       return 'degraded';
  return 'operational';
}

function stripHtml(html: string): string {
  return (html || '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
}

export async function GET() {
  try {
    const token = await getAccessToken();

    const [healthData, issuesData] = await Promise.all([
      graphGet('/admin/serviceAnnouncement/healthOverviews', token),
      graphGet('/admin/serviceAnnouncement/issues?$filter=isResolved%20eq%20false', token),
    ]);

    // All services sorted: degraded first, then alphabetical
    const allServices: M365Service[] = (healthData.value as any[])
      .map((svc: any) => ({
        name: svc.service,
        workload: svc.id,
        status: svc.status,
        severity: mapStatus(svc.status),
        updatedAt: svc.lastModifiedDateTime || new Date().toISOString(),
      }))
      .sort((a, b) => {
        const rank: Record<Severity, number> = { major_outage: 0, partial_outage: 1, degraded: 2, operational: 3 };
        return rank[a.severity] - rank[b.severity] || a.name.localeCompare(b.name);
      });

    // Active incidents from the issues endpoint
    const incidents: Incident[] = (issuesData.value as any[]).map((issue: any) => {
      const body = stripHtml(issue.impactDescription || '');
      return {
        id: issue.id,
        name: issue.title,
        status: issue.status,
        impact: mapStatus(issue.status),
        createdAt: issue.startDateTime || new Date().toISOString(),
        updatedAt: issue.lastModifiedDateTime || new Date().toISOString(),
        affectedServices: [issue.service],
        updates: body
          ? [{ id: '1', status: issue.status, body, createdAt: issue.lastModifiedDateTime || '' }]
          : [],
        url: 'https://admin.microsoft.com/adminportal/home#/servicehealth',
      };
    });

    return Response.json({
      provider: 'Microsoft Health',
      slug: 'm365health',
      severity: overallSeverity(allServices),
      activeCount: incidents.length,
      incidents,
      allServices,
      lastUpdated: new Date().toISOString(),
    });
  } catch (err) {
    return Response.json({
      provider: 'Microsoft Health',
      slug: 'm365health',
      severity: 'operational' as Severity,
      activeCount: 0,
      incidents: [],
      allServices: [],
      lastUpdated: new Date().toISOString(),
      error: err instanceof Error ? err.message : 'Unable to fetch Microsoft 365 health',
    });
  }
}
