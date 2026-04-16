import { Severity } from '@/lib/types';
import { fetchCloudMicrosoftPost, macPostToIncidents, overallSeverity } from '@/lib/microsoft-helpers';

export async function GET() {
  try {
    // SharePoint Online has no dedicated public status endpoint.
    // api/posts/mac reflects overall M365 enterprise health, which covers SharePoint.
    const post = await fetchCloudMicrosoftPost('api/posts/mac');
    const incidents = macPostToIncidents(
      post,
      'sharepoint',
      'SharePoint Online',
      'https://status.cloud.microsoft',
    );

    return Response.json({
      provider: 'SharePoint',
      slug: 'sharepoint',
      severity: overallSeverity(incidents),
      activeCount: incidents.length,
      incidents,
      lastUpdated: new Date().toISOString(),
      note: 'Reflects overall M365 enterprise health — no public per-service API available',
    });
  } catch {
    return Response.json({
      provider: 'SharePoint',
      slug: 'sharepoint',
      severity: 'operational' as Severity,
      activeCount: 0,
      incidents: [],
      lastUpdated: new Date().toISOString(),
      error: 'Unable to fetch SharePoint status',
    });
  }
}
