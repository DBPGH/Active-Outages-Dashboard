import { Severity, Incident } from '@/lib/types';

const PAGE_ID = '619cf82551fec9053d612f09';

// status.io status codes
function mapStatusCode(code: number): Severity {
  if (code >= 500) return 'major_outage';
  if (code >= 400) return 'partial_outage';
  if (code >= 300) return 'degraded';
  if (code >= 200) return 'degraded'; // planned maintenance
  return 'operational';
}

function overallSeverity(incidents: Incident[]): Severity {
  if (incidents.length === 0) return 'operational';
  if (incidents.some(i => i.impact === 'major_outage'))   return 'major_outage';
  if (incidents.some(i => i.impact === 'partial_outage')) return 'partial_outage';
  return 'degraded';
}

export async function GET() {
  try {
    const res = await fetch(`https://api.status.io/1.0/status/${PAGE_ID}`, {
      headers: { 'User-Agent': 'OutageDashboard/1.0' },
      cache: 'no-store',
    });

    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    const data = await res.json();
    const services: any[] = data.result?.status || [];

    // Surface any non-operational service as an incident
    const incidents: Incident[] = services
      .filter((svc: any) => svc.status_code !== 100)
      .map((svc: any) => {
        const severity = mapStatusCode(svc.status_code);

        // Regions/containers affected
        const affectedRegions = (svc.containers || [])
          .filter((c: any) => c.status_code !== 100)
          .map((c: any) => `${c.name} (${c.status})`);

        return {
          id: svc.id,
          name: `${svc.name} — ${svc.status}`,
          status: svc.status,
          impact: severity,
          createdAt: svc.updated || new Date().toISOString(),
          updatedAt: svc.updated || new Date().toISOString(),
          affectedServices: affectedRegions.length > 0 ? affectedRegions : [svc.name],
          updates: [],
          url: 'https://status.connectwise.com',
        };
      });

    return Response.json({
      provider: 'ConnectWise',
      slug: 'connectwise',
      severity: overallSeverity(incidents),
      activeCount: incidents.length,
      incidents,
      lastUpdated: new Date().toISOString(),
    });
  } catch {
    return Response.json({
      provider: 'ConnectWise',
      slug: 'connectwise',
      severity: 'operational' as Severity,
      activeCount: 0,
      incidents: [],
      lastUpdated: new Date().toISOString(),
      error: 'Unable to fetch ConnectWise status',
    });
  }
}
