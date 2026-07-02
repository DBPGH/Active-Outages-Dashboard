import { Severity, Incident } from '@/lib/types';
import { getHealthOverviews, getActiveIssues, mapGraphStatus, overallSeverity, stripHtml } from '@/lib/m365-graph';

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ workload: string }> },
) {
  const { workload } = await params;

  try {
    const [overviews, issues] = await Promise.all([
      getHealthOverviews(),
      getActiveIssues(),
    ]);

    const svc = overviews.find((s: any) => s.id === workload);
    if (!svc) {
      return Response.json({
        provider: workload,
        slug: `m365/${workload}`,
        severity: 'operational' as Severity,
        activeCount: 0,
        incidents: [],
        lastUpdated: new Date().toISOString(),
        error: `Service "${workload}" not found`,
      });
    }

    const svcIssues = issues.filter((i: any) => i.service === svc.service);
    const incidents: Incident[] = svcIssues.map((issue: any) => {
      const body = stripHtml(issue.impactDescription || '');
      return {
        id: issue.id,
        name: issue.title,
        status: issue.status,
        impact: mapGraphStatus(issue.status),
        createdAt: issue.startDateTime || new Date().toISOString(),
        updatedAt: issue.lastModifiedDateTime || new Date().toISOString(),
        affectedServices: [issue.service],
        updates: body
          ? [{ id: '1', status: issue.status, body, createdAt: issue.lastModifiedDateTime || '' }]
          : [],
        url: 'https://admin.microsoft.com/adminportal/home#/servicehealth',
      };
    });

    return Response.json({
      provider: svc.service,
      slug: `m365/${workload}`,
      severity: overallSeverity(incidents.map(i => i.impact)),
      activeCount: incidents.length,
      incidents,
      lastUpdated: new Date().toISOString(),
    });
  } catch (err) {
    return Response.json({
      provider: workload,
      slug: `m365/${workload}`,
      severity: 'operational' as Severity,
      activeCount: 0,
      incidents: [],
      lastUpdated: new Date().toISOString(),
      error: err instanceof Error ? err.message : 'Unable to fetch service health',
    });
  }
}
