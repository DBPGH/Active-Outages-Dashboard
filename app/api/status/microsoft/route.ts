import { Severity, Incident } from '@/lib/types';

const BASE = 'https://status.cloud.microsoft';

// Status values observed from the API
function mapStatus(status: string): Severity {
  switch ((status || '').toLowerCase()) {
    case 'servicedisruption':
    case 'disrupted':
    case 'disruption':       return 'major_outage';
    case 'servicedegradation':
    case 'degraded':
    case 'degradation':      return 'partial_outage';
    case 'informational':
    case 'investigating':    return 'degraded';
    default:                 return 'operational';
  }
}

function overallSeverity(incidents: Incident[]): Severity {
  if (incidents.length === 0) return 'operational';
  if (incidents.some(i => i.impact === 'major_outage')) return 'major_outage';
  if (incidents.some(i => i.impact === 'partial_outage')) return 'partial_outage';
  return 'degraded';
}

async function fetchJson(url: string) {
  const res = await fetch(url, {
    headers: { 'User-Agent': 'OutageDashboard/1.0' },
    cache: 'no-store',
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

export async function GET() {
  try {
    // Fetch M365 enterprise (admin center) status and per-service consumer statuses in parallel
    const [macPost, consumerServices] = await Promise.all([
      fetchJson(`${BASE}/api/posts/mac`),
      fetchJson(`${BASE}/api/posts/m365Consumer`),
    ]);

    const incidents: Incident[] = [];

    // --- Enterprise / admin center post ---
    // Status is "Available" when healthy; anything else is an incident
    if (macPost?.Status && macPost.Status !== 'Available') {
      const severity = mapStatus(macPost.Status);
      incidents.push({
        id: macPost.Id || 'mac-enterprise',
        name: macPost.Title || 'Microsoft 365 Service Issue',
        status: macPost.Status,
        impact: severity,
        createdAt: macPost.AuthoredDateTime || new Date().toISOString(),
        updatedAt: macPost.LastUpdatedTime || macPost.AuthoredDateTime || new Date().toISOString(),
        affectedServices: ['Microsoft 365 (Enterprise)'],
        updates: macPost.Message
          ? [{
              id: '1',
              status: macPost.Status,
              body: macPost.Message.replace(/<[^>]+>/g, ' ').trim(),
              createdAt: macPost.LastUpdatedTime || macPost.AuthoredDateTime || '',
            }]
          : [],
        url: 'https://status.cloud.microsoft',
      });
    }

    // --- Consumer per-service statuses ---
    // Each entry with Status !== "Operational" becomes an incident
    for (const svc of (consumerServices as any[])) {
      if (!svc.Status || svc.Status === 'Operational') continue;

      const severity = mapStatus(svc.Status);
      incidents.push({
        id: svc.ServiceWorkloadName || `consumer-${svc.ServiceDisplayName}`,
        name: svc.Title || `${svc.ServiceDisplayName} — ${svc.Status}`,
        status: svc.Status,
        impact: severity,
        createdAt: svc.AuthoredDateTime || new Date().toISOString(),
        updatedAt: svc.LastUpdatedTime || svc.AuthoredDateTime || new Date().toISOString(),
        affectedServices: [svc.ServiceDisplayName],
        updates: svc.Message
          ? [{
              id: '1',
              status: svc.Status,
              body: svc.Message.replace(/<[^>]+>/g, ' ').trim(),
              createdAt: svc.LastUpdatedTime || '',
            }]
          : [],
        url: 'https://status.cloud.microsoft',
      });
    }

    return Response.json({
      provider: 'Microsoft 365',
      slug: 'microsoft',
      severity: overallSeverity(incidents),
      activeCount: incidents.length,
      incidents,
      lastUpdated: new Date().toISOString(),
    });
  } catch (err) {
    return Response.json({
      provider: 'Microsoft 365',
      slug: 'microsoft',
      severity: 'operational' as Severity,
      activeCount: 0,
      incidents: [],
      lastUpdated: new Date().toISOString(),
      error: 'Unable to fetch Microsoft 365 status',
    });
  }
}
