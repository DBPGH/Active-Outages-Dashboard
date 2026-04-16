import { Severity, Incident } from '@/lib/types';

// AWS status numeric codes: 0=operational, 1=informational, 2=degraded, 3=disruption
function mapAWSNumericStatus(status: string | number): Severity {
  switch (String(status)) {
    case '3': return 'major_outage';
    case '2': return 'partial_outage';
    case '1': return 'degraded';
    default:  return 'operational';
  }
}

function overallSeverity(incidents: Incident[]): Severity {
  if (incidents.length === 0) return 'operational';
  if (incidents.some(i => i.impact === 'major_outage')) return 'major_outage';
  if (incidents.some(i => i.impact === 'partial_outage')) return 'partial_outage';
  return 'degraded';
}

// The new AWS health endpoint returns UTF-16 BE encoded JSON (with FE FF BOM)
async function fetchAWSJson(url: string): Promise<any> {
  const res = await fetch(url, {
    headers: { 'User-Agent': 'OutageDashboard/1.0' },
    cache: 'no-store',
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);

  const contentType = res.headers.get('content-type') || '';
  if (contentType.includes('utf-16')) {
    const buffer = await res.arrayBuffer();
    const bytes = new Uint8Array(buffer);
    // FE FF = UTF-16 BE BOM, FF FE = UTF-16 LE BOM
    const encoding = (bytes[0] === 0xFE && bytes[1] === 0xFF) ? 'utf-16be' : 'utf-16le';
    const text = new TextDecoder(encoding).decode(buffer);
    // Strip BOM character if present
    return JSON.parse(text.replace(/^\uFEFF/, ''));
  }
  return res.json();
}

export async function GET() {
  try {
    // New endpoint — redirected from status.aws.amazon.com/data.json
    const events: any[] = await fetchAWSJson('https://health.aws.amazon.com/public/currentevents');

    const incidents: Incident[] = events.map((event: any, idx: number) => {
      // Collect impacted service names where current > 0
      const impactedServices: string[] = Object.values(event.impacted_services || {})
        .filter((s: any) => Number(s.current) > 0)
        .map((s: any) => s.service_name);

      // Fall back to top-level service_name if nothing more specific
      const affectedServices = impactedServices.length > 0
        ? impactedServices
        : [event.service_name].filter(Boolean);

      // event_log is newest-last; reverse so latest update is first
      const eventLog: any[] = (event.event_log || []).slice().reverse();

      const updates = eventLog.map((log: any, i: number) => ({
        id: String(i),
        status: mapAWSNumericStatus(log.status),
        body: log.message || log.summary || '',
        createdAt: log.timestamp
          ? new Date(Number(log.timestamp) * 1000).toISOString()
          : '',
      }));

      const createdAt = event.date
        ? new Date(Number(event.date) * 1000).toISOString()
        : new Date().toISOString();

      const updatedAt = eventLog[0]?.timestamp
        ? new Date(Number(eventLog[0].timestamp) * 1000).toISOString()
        : createdAt;

      return {
        id: event.arn || `aws-${idx}`,
        name: event.summary || 'Unknown Issue',
        status: mapAWSNumericStatus(event.status),
        impact: mapAWSNumericStatus(event.status),
        createdAt,
        updatedAt,
        affectedServices,
        updates,
        url: 'https://health.aws.amazon.com/health/status',
      };
    });

    return Response.json({
      provider: 'AWS',
      slug: 'aws',
      severity: overallSeverity(incidents),
      activeCount: incidents.length,
      incidents,
      lastUpdated: new Date().toISOString(),
    });
  } catch (err) {
    return Response.json({
      provider: 'AWS',
      slug: 'aws',
      severity: 'operational' as Severity,
      activeCount: 0,
      incidents: [],
      lastUpdated: new Date().toISOString(),
      error: 'Unable to fetch AWS status',
    });
  }
}
