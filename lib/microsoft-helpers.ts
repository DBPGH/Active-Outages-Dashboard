import { Severity, Incident } from './types';

const BASE = 'https://status.cloud.microsoft';

export async function fetchCloudMicrosoftPost(path: string) {
  const res = await fetch(`${BASE}/${path}`, {
    headers: { 'User-Agent': 'OutageDashboard/1.0' },
    cache: 'no-store',
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

export function mapMacStatus(status: string): Severity {
  switch ((status || '').toLowerCase()) {
    case 'servicedisruption':
    case 'disrupted':
    case 'disruption':     return 'major_outage';
    case 'servicedegradation':
    case 'degraded':
    case 'degradation':    return 'partial_outage';
    case 'informational':
    case 'investigating':  return 'degraded';
    default:               return 'operational';
  }
}

// Converts a single status.cloud.microsoft "post" object into the incident list
// used by both Azure and M365-proxy routes.
export function macPostToIncidents(
  post: any,
  fallbackName: string,
  affectedService: string,
  statusPageUrl: string,
): Incident[] {
  if (!post || post.Status === 'Available') return [];

  const severity = mapMacStatus(post.Status);
  return [{
    id: post.Id || fallbackName,
    name: post.Title || `${affectedService} Service Issue`,
    status: post.Status,
    impact: severity,
    createdAt: post.AuthoredDateTime || new Date().toISOString(),
    updatedAt: post.LastUpdatedTime || post.AuthoredDateTime || new Date().toISOString(),
    affectedServices: [affectedService],
    updates: post.Message
      ? [{
          id: '1',
          status: post.Status,
          body: post.Message.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim(),
          createdAt: post.LastUpdatedTime || post.AuthoredDateTime || '',
        }]
      : [],
    url: statusPageUrl,
  }];
}

export function overallSeverity(incidents: Incident[]): Severity {
  if (incidents.length === 0) return 'operational';
  if (incidents.some(i => i.impact === 'major_outage')) return 'major_outage';
  if (incidents.some(i => i.impact === 'partial_outage')) return 'partial_outage';
  return 'degraded';
}
