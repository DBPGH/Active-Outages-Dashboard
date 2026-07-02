import { Severity, Incident } from '@/lib/types';
import { fetchCloudMicrosoftPost, mapMacStatus, overallSeverity } from '@/lib/microsoft-helpers';

export interface M365Service {
  name: string;
  workload: string;
  status: string;
  severity: Severity;
  updatedAt: string;
  title?: string;
  message?: string;
}

function svcToIncident(svc: M365Service, id: string): Incident {
  return {
    id,
    name: svc.title || `${svc.name} — ${svc.status}`,
    status: svc.status,
    impact: svc.severity,
    createdAt: svc.updatedAt,
    updatedAt: svc.updatedAt,
    affectedServices: [svc.name],
    updates: svc.message
      ? [{ id: '1', status: svc.status, body: svc.message, createdAt: svc.updatedAt }]
      : [],
    url: 'https://status.cloud.microsoft',
  };
}

function cleanHtml(html: string): string {
  return html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
}

export async function GET() {
  try {
    const [macPost, consumerServices] = await Promise.all([
      fetchCloudMicrosoftPost('api/posts/mac'),
      fetchCloudMicrosoftPost('api/posts/m365Consumer'),
    ]);

    const allServices: M365Service[] = [];
    const incidents: Incident[] = [];

    // Enterprise overall health
    const entSeverity: Severity =
      macPost?.Status && macPost.Status !== 'Available'
        ? mapMacStatus(macPost.Status)
        : 'operational';

    const entMessage = macPost?.Message ? cleanHtml(macPost.Message) : undefined;

    allServices.push({
      name: 'Microsoft 365 (Enterprise)',
      workload: 'M365Enterprise',
      status: macPost?.Status || 'Available',
      severity: entSeverity,
      updatedAt: macPost?.LastUpdatedTime || new Date().toISOString(),
      title: macPost?.Title || undefined,
      message: entMessage,
    });

    if (entSeverity !== 'operational') {
      incidents.push(svcToIncident(allServices[0], macPost.Id || 'mac-enterprise'));
    }

    // Per-service consumer health
    for (const raw of (consumerServices as any[])) {
      const severity = mapMacStatus(raw.Status);
      const message = raw.Message ? cleanHtml(raw.Message) : undefined;

      const svc: M365Service = {
        name: raw.ServiceDisplayName,
        workload: raw.ServiceWorkloadName,
        status: raw.Status,
        severity,
        updatedAt: raw.LastUpdatedTime || new Date().toISOString(),
        title: raw.Title || undefined,
        message,
      };

      allServices.push(svc);

      if (severity !== 'operational') {
        incidents.push(svcToIncident(svc, raw.ServiceWorkloadName || `consumer-${raw.ServiceDisplayName}`));
      }
    }

    return Response.json({
      provider: 'Microsoft Health',
      slug: 'm365health',
      severity: overallSeverity(incidents),
      activeCount: incidents.length,
      incidents,
      allServices,
      lastUpdated: new Date().toISOString(),
    });
  } catch {
    return Response.json({
      provider: 'Microsoft Health',
      slug: 'm365health',
      severity: 'operational' as Severity,
      activeCount: 0,
      incidents: [],
      allServices: [],
      lastUpdated: new Date().toISOString(),
      error: 'Unable to fetch Microsoft 365 health',
    });
  }
}
