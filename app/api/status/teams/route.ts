import { Severity } from '@/lib/types';
import { fetchCloudMicrosoftPost, macPostToIncidents, overallSeverity } from '@/lib/microsoft-helpers';

export async function GET() {
  try {
    // Teams enterprise has no dedicated public status endpoint.
    // api/posts/mac reflects overall M365 enterprise health, which covers Teams.
    const post = await fetchCloudMicrosoftPost('api/posts/mac');
    const incidents = macPostToIncidents(
      post,
      'teams',
      'Microsoft 365',
      'https://status.cloud.microsoft',
    );

    return Response.json({
      provider: 'Microsoft 365',
      slug: 'teams',
      severity: overallSeverity(incidents),
      activeCount: incidents.length,
      incidents,
      lastUpdated: new Date().toISOString(),
      note: 'Reflects overall M365 enterprise health — no public per-service API available',
    });
  } catch {
    return Response.json({
      provider: 'Microsoft 365',
      slug: 'teams',
      severity: 'operational' as Severity,
      activeCount: 0,
      incidents: [],
      lastUpdated: new Date().toISOString(),
      error: 'Unable to fetch Microsoft 365 status',
    });
  }
}
