import { Severity, Incident } from '@/lib/types';

function overallSeverity(incidents: Incident[]): Severity {
  if (incidents.length === 0) return 'operational';
  if (incidents.some(i => i.impact === 'major_outage'))   return 'major_outage';
  if (incidents.some(i => i.impact === 'partial_outage')) return 'partial_outage';
  return 'degraded';
}

export async function GET() {
  try {
    const [configRes, heartbeatRes] = await Promise.all([
      fetch('https://status.internetpro.net/api/status-page/all', {
        headers: { 'User-Agent': 'OutageDashboard/1.0' },
        cache: 'no-store',
      }),
      fetch('https://status.internetpro.net/api/status-page/heartbeat/all', {
        headers: { 'User-Agent': 'OutageDashboard/1.0' },
        cache: 'no-store',
      }),
    ]);

    if (!configRes.ok || !heartbeatRes.ok) throw new Error('HTTP error');

    const [config, heartbeat] = await Promise.all([configRes.json(), heartbeatRes.json()]);

    // Build monitor ID → name map from group list
    const monitorNames: Record<number, string> = {};
    for (const group of (config.publicGroupList || [])) {
      for (const monitor of (group.monitorList || [])) {
        monitorNames[monitor.id] = monitor.name;
      }
    }

    const incidents: Incident[] = [];

    // Surface monitors that are currently DOWN (status=2)
    for (const [idStr, beats] of Object.entries(heartbeat.heartbeatList || {})) {
      const latest = (beats as any[])[0];
      if (!latest || latest.status !== 2) continue;

      const id = Number(idStr);
      const name = monitorNames[id] || `Monitor ${id}`;
      incidents.push({
        id: idStr,
        name,
        status: 'investigating',
        impact: 'major_outage',
        createdAt: latest.time ? new Date(latest.time).toISOString() : new Date().toISOString(),
        updatedAt: latest.time ? new Date(latest.time).toISOString() : new Date().toISOString(),
        affectedServices: [name],
        updates: latest.msg
          ? [{ id: `${idStr}-0`, status: 'investigating', body: latest.msg, createdAt: new Date().toISOString() }]
          : [],
        url: 'https://status.internetpro.net/status/all',
      });
    }

    // Also surface any active posted incidents
    for (const inc of (config.incidents || [])) {
      if (!inc.active) continue;
      incidents.push({
        id: String(inc.id),
        name: inc.title,
        status: 'investigating',
        impact: 'partial_outage' as Severity,
        createdAt: inc.createdDate || new Date().toISOString(),
        updatedAt: inc.lastUpdatedDate || inc.createdDate || new Date().toISOString(),
        affectedServices: [],
        updates: inc.content
          ? [{ id: `inc-${inc.id}`, status: 'investigating', body: inc.content, createdAt: inc.createdDate || new Date().toISOString() }]
          : [],
        url: 'https://status.internetpro.net/status/all',
      });
    }

    return Response.json({
      provider: 'Network Solutions',
      slug: 'networksolutions',
      severity: overallSeverity(incidents),
      activeCount: incidents.length,
      incidents,
      lastUpdated: new Date().toISOString(),
    });
  } catch {
    return Response.json({
      provider: 'Network Solutions',
      slug: 'networksolutions',
      severity: 'operational' as Severity,
      activeCount: 0,
      incidents: [],
      lastUpdated: new Date().toISOString(),
      error: 'Unable to fetch Network Solutions status',
    });
  }
}
