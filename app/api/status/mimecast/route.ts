import { Severity, Incident } from '@/lib/types';

function mapStatusCode(code: number): Severity {
  if (code >= 400) return 'major_outage';
  if (code >= 300) return 'partial_outage';
  if (code >= 200) return 'degraded';
  return 'operational';
}

export async function GET() {
  try {
    const [statusRes, incidentsRes] = await Promise.all([
      fetch('https://api.status.io/1.0/status/5d849b1c02e65b3ec45369d4', { cache: 'no-store' }),
      fetch('https://api.status.io/1.0/incidents/5d849b1c02e65b3ec45369d4', { cache: 'no-store' }),
    ]);

    if (!statusRes.ok) throw new Error(`HTTP ${statusRes.status}`);

    const statusData = await statusRes.json();
    const incidentsData = incidentsRes.ok ? await incidentsRes.json() : { result: { incidents: [] } };

    const overallCode: number = statusData.result?.status_overall?.status_code ?? 100;

    const activeIncidents: Incident[] = (incidentsData.result?.incidents || [])
      .filter((i: any) => !i.datetime_closed)
      .map((incident: any) => ({
        id: incident._id,
        name: incident.name,
        status: incident.status || 'investigating',
        impact: mapStatusCode(overallCode),
        createdAt: incident.datetime_open,
        updatedAt: incident.datetime_open,
        affectedServices: (incident.components_affected || []).map((c: any) => c.component_name || c),
        updates: (incident.messages || []).map((m: any) => ({
          id: m._id || m.datetime,
          status: m.status || '',
          body: m.details || m.message || '',
          createdAt: m.datetime,
        })),
        url: `https://status.mimecast.com`,
      }));

    return Response.json({
      provider: 'Mimecast',
      slug: 'mimecast',
      severity: mapStatusCode(overallCode),
      activeCount: activeIncidents.length,
      incidents: activeIncidents,
      lastUpdated: new Date().toISOString(),
    });
  } catch {
    return Response.json({
      provider: 'Mimecast',
      slug: 'mimecast',
      severity: 'operational' as Severity,
      activeCount: 0,
      incidents: [],
      lastUpdated: new Date().toISOString(),
      error: 'Unable to fetch Mimecast status',
    });
  }
}
