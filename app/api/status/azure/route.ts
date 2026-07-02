import { Severity, Incident } from '@/lib/types';
import { fetchCloudMicrosoftPost, macPostToIncidents, overallSeverity } from '@/lib/microsoft-helpers';

const AZURE_STATUS_URL = 'https://azure.status.microsoft/en-us/status/';

function extractTag(xml: string, tag: string): string {
  const escaped = tag.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(':', '\\:');
  const cdata = xml.match(new RegExp(`<${escaped}[^>]*><!\\[CDATA\\[([\\s\\S]*?)\\]\\]><\\/${escaped}>`));
  if (cdata) return cdata[1];
  const plain = xml.match(new RegExp(`<${escaped}[^>]*>([\\s\\S]*?)<\\/${escaped}>`));
  return plain ? plain[1] : '';
}

function toIso(dateStr: string): string {
  if (!dateStr) return new Date().toISOString();
  try { return new Date(dateStr).toISOString(); } catch { return new Date().toISOString(); }
}

function inferSeverity(title: string, body: string): Severity {
  const text = (title + ' ' + body).toLowerCase();
  if (/outage|disruption|unavailable|\bdown\b/.test(text)) return 'major_outage';
  if (/degrad|slow|intermittent|partial/.test(text))       return 'partial_outage';
  return 'degraded';
}

function parseRssIncidents(xml: string): Incident[] {
  const incidents: Incident[] = [];
  const itemRe = /<item>([\s\S]*?)<\/item>/g;
  let m: RegExpExecArray | null;
  let idx = 0;
  while ((m = itemRe.exec(xml)) !== null) {
    const x = m[1];
    const title   = extractTag(x, 'title').trim();
    const guid    = extractTag(x, 'guid').trim();
    const link    = extractTag(x, 'link').trim() || AZURE_STATUS_URL;
    const pubDate = toIso(extractTag(x, 'pubDate'));
    const updated = toIso(extractTag(x, 'a10:updated') || extractTag(x, 'updated') || extractTag(x, 'pubDate'));
    const body    = extractTag(x, 'description')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    incidents.push({
      id: guid || `azure-rss-${idx}`,
      name: title || 'Azure Service Issue',
      status: 'Active',
      impact: inferSeverity(title, body),
      createdAt: pubDate,
      updatedAt: updated,
      affectedServices: ['Microsoft Azure'],
      updates: body
        ? [{ id: '1', status: 'Active', body, createdAt: updated }]
        : [],
      url: link,
    });
    idx++;
  }
  return incidents;
}

export async function GET() {
  try {
    const [rssResult, postResult] = await Promise.allSettled([
      fetch(`${AZURE_STATUS_URL}feed/`, {
        headers: { 'User-Agent': 'OutageDashboard/1.0' },
        cache: 'no-store',
      }).then(r => { if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.text(); }),
      fetchCloudMicrosoftPost('api/posts/azure'),
    ]);

    const rssIncidents = rssResult.status === 'fulfilled'
      ? parseRssIncidents(rssResult.value)
      : [];

    const summaryIncidents = postResult.status === 'fulfilled'
      ? macPostToIncidents(postResult.value, 'azure', 'Microsoft Azure', AZURE_STATUS_URL)
      : [];

    // RSS items are the authoritative health advisories; fall back to summary if RSS is empty
    const incidents = rssIncidents.length > 0 ? rssIncidents : summaryIncidents;

    return Response.json({
      provider: 'Azure',
      slug: 'azure',
      severity: overallSeverity(incidents),
      activeCount: incidents.length,
      incidents,
      lastUpdated: new Date().toISOString(),
    });
  } catch {
    return Response.json({
      provider: 'Azure',
      slug: 'azure',
      severity: 'operational' as Severity,
      activeCount: 0,
      incidents: [],
      lastUpdated: new Date().toISOString(),
      error: 'Unable to fetch Azure status',
    });
  }
}
