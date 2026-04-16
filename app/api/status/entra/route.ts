import { Severity, Incident } from '@/lib/types';
import { overallSeverity } from '@/lib/microsoft-helpers';

// data-label values from Azure Status page and their severity mapping
function mapAzureLabel(label: string): Severity {
  switch ((label || '').toLowerCase()) {
    case 'good':
    case 'no widespread issue': return 'operational';
    case 'information':
    case 'informational':      return 'degraded';
    case 'warning':
    case 'degraded':           return 'partial_outage';
    case 'error':
    case 'disruption':
    case 'service disruption': return 'major_outage';
    default:                   return 'operational';
  }
}

function worstLabel(labels: string[]): Severity {
  const order: Severity[] = ['operational', 'degraded', 'partial_outage', 'major_outage'];
  const severities = labels
    .filter(l => l.toLowerCase() !== 'not available')
    .map(mapAzureLabel);
  if (severities.length === 0) return 'operational';
  return severities.reduce((worst, s) =>
    order.indexOf(s) > order.indexOf(worst) ? s : worst
  , 'operational');
}

async function fetchEntraStatus(): Promise<{ severity: Severity; regions: { name: string; label: string }[] }> {
  const res = await fetch('https://azure.status.microsoft/en-us/status/', {
    headers: { 'User-Agent': 'OutageDashboard/1.0' },
    cache: 'no-store',
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const html = await res.text();

  // Find the table row for Entra ID (server-rendered HTML)
  const rowMatch = html.match(
    /<tr>\s*<td>\s*\n\s*Microsoft Entra ID[^<]*<\/td>([\s\S]*?)<\/tr>/
  );
  if (!rowMatch) throw new Error('Entra ID row not found in Azure Status page');

  const rowHtml = rowMatch[1];

  // Extract all region header names (from the <th> row above) — approximate by
  // extracting data-labels from the status cells in the matched row
  const cellMatches = [...rowHtml.matchAll(/data-label="([^"]+)"/g)];
  const labels = cellMatches.map(m => m[1]);

  const severity = worstLabel(labels);
  return { severity, regions: [] }; // regions detail not needed for now
}

export async function GET() {
  try {
    const { severity } = await fetchEntraStatus();

    const incidents: Incident[] = severity === 'operational' ? [] : [{
      id: 'entra-id',
      name: 'Microsoft Entra ID Service Issue',
      status: severity,
      impact: severity,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      affectedServices: ['Microsoft Entra ID'],
      updates: [{
        id: '1',
        status: severity,
        body: 'One or more Azure regions are reporting a non-Good status for Microsoft Entra ID. Check the Azure Status page for regional details.',
        createdAt: new Date().toISOString(),
      }],
      url: 'https://azure.status.microsoft/en-us/status/',
    }];

    return Response.json({
      provider: 'Entra ID',
      slug: 'entra',
      severity,
      activeCount: incidents.length,
      incidents,
      lastUpdated: new Date().toISOString(),
    });
  } catch {
    return Response.json({
      provider: 'Entra ID',
      slug: 'entra',
      severity: 'operational' as Severity,
      activeCount: 0,
      incidents: [],
      lastUpdated: new Date().toISOString(),
      error: 'Unable to fetch Entra ID status',
    });
  }
}
