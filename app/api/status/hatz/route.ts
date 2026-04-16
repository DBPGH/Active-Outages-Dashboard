import { Severity, Incident } from '@/lib/types';

function mapImpact(impact: string): Severity {
  switch ((impact || '').toLowerCase()) {
    case 'critical': return 'major_outage';
    case 'major':    return 'partial_outage';
    case 'minor':    return 'degraded';
    default:         return 'operational';
  }
}

export async function GET() {
  try {
    const res = await fetch('https://status.hatz.ai/api/v2/summary.json', {
      headers: { 'User-Agent': 'OutageDashboard/1.0' },
      cache: 'no-store',
    });

    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    const data = await res.json();

    const activeIncidents: Incident[] = (data.incidents || [])
      .filter((i: any) => i.status !== 'resolved')
      .map((incident: any) => ({
        id: incident.id,
        name: incident.name,
        status: incident.status,
        impact: mapImpact(incident.impact),
        createdAt: incident.created_at,
        updatedAt: incident.updated_at,
        affectedServices: (incident.components || []).map((c: any) => c.name),
        updates: (incident.incident_updates || []).map((u: any) => ({
          id: u.id,
          status: u.status,
          body: u.body,
          createdAt: u.created_at,
        })),
        url: incident.shortlink || `https://status.hatz.ai/incidents/${incident.id}`,
      }));

    return Response.json({
      provider: 'Hatz.ai',
      slug: 'hatz',
      severity: mapImpact(data.status?.indicator || 'none'),
      activeCount: activeIncidents.length,
      incidents: activeIncidents,
      lastUpdated: new Date().toISOString(),
    });
  } catch {
    return Response.json({
      provider: 'Hatz.ai',
      slug: 'hatz',
      severity: 'operational' as Severity,
      activeCount: 0,
      incidents: [],
      lastUpdated: new Date().toISOString(),
      error: 'Unable to fetch Hatz.ai status',
    });
  }
}
