import { Severity, Incident } from '@/lib/types';

function extractTag(xml: string, tag: string): string {
  const re = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, 'i');
  const match = xml.match(re);
  if (!match) return '';
  return match[1].replace(/^<!\[CDATA\[/, '').replace(/\]\]>$/, '').trim();
}

export async function GET() {
  try {
    const res = await fetch('https://status.3cx.net/webmeeting.rss', {
      headers: { 'User-Agent': 'OutageDashboard/1.0' },
      cache: 'no-store',
    });

    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    const xml = await res.text();

    const itemBlocks = xml.match(/<item>([\s\S]*?)<\/item>/g) ?? [];
    const cutoff = Date.now() - 48 * 60 * 60 * 1000; // 48 hours

    const incidents: Incident[] = [];

    for (const block of itemBlocks) {
      const title   = extractTag(block, 'title');
      const pubDate = extractTag(block, 'pubDate');
      const guid    = extractTag(block, 'guid');
      const desc    = extractTag(block, 'description');

      const date = pubDate ? new Date(pubDate) : new Date();
      if (date.getTime() < cutoff) continue;

      const isResolved = /resolv|restor|complet/i.test(title + desc);

      incidents.push({
        id: guid || title,
        name: title,
        status: isResolved ? 'resolved' : 'monitoring',
        impact: isResolved ? 'operational' : 'degraded',
        createdAt: date.toISOString(),
        updatedAt: date.toISOString(),
        affectedServices: ['WebMeeting'],
        updates: desc ? [{ id: `${guid}-0`, status: 'update', body: desc, createdAt: date.toISOString() }] : [],
        url: 'https://status.3cx.net',
      });
    }

    const activeIncidents = incidents.filter(i => i.status !== 'resolved');

    const severity: Severity = activeIncidents.length > 0 ? 'degraded' : 'operational';

    return Response.json({
      provider: '3CX',
      slug: '3cx',
      severity,
      activeCount: activeIncidents.length,
      incidents: activeIncidents,
      lastUpdated: new Date().toISOString(),
    });
  } catch {
    return Response.json({
      provider: '3CX',
      slug: '3cx',
      severity: 'operational' as Severity,
      activeCount: 0,
      incidents: [],
      lastUpdated: new Date().toISOString(),
      error: 'Unable to fetch 3CX status',
    });
  }
}
