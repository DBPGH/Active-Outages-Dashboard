import { Severity } from '@/lib/types';
import { fetchCloudMicrosoftPost, macPostToIncidents, overallSeverity } from '@/lib/microsoft-helpers';

export async function GET() {
  try {
    const post = await fetchCloudMicrosoftPost('api/posts/azure');
    const incidents = macPostToIncidents(
      post,
      'azure',
      'Microsoft Azure',
      'https://azure.status.microsoft',
    );

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
