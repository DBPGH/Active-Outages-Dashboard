import { Severity } from './types';

let cachedToken: { value: string; expiresAt: number } | null = null;
let cachedOverviews: { data: any[]; fetchedAt: number } | null = null;
const OVERVIEW_TTL = 30_000;

export async function getAccessToken(): Promise<string> {
  const now = Date.now();
  if (cachedToken && cachedToken.expiresAt > now + 60_000) return cachedToken.value;

  const tenantId = process.env.MS_TENANT_ID;
  const clientId = process.env.MS_CLIENT_ID;
  const clientSecret = process.env.MS_CLIENT_SECRET;
  if (!tenantId || !clientId || !clientSecret) {
    throw new Error('MS_TENANT_ID, MS_CLIENT_ID, and MS_CLIENT_SECRET must be set');
  }

  const res = await fetch(
    `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'client_credentials',
        client_id: clientId,
        client_secret: clientSecret,
        scope: 'https://graph.microsoft.com/.default',
      }).toString(),
      cache: 'no-store',
    },
  );
  if (!res.ok) throw new Error(`Token request failed: HTTP ${res.status}`);
  const data = await res.json();
  cachedToken = { value: data.access_token, expiresAt: now + data.expires_in * 1000 };
  return cachedToken.value;
}

export async function graphGet(path: string) {
  const token = await getAccessToken();
  const res = await fetch(`https://graph.microsoft.com/v1.0${path}`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: 'no-store',
  });
  if (!res.ok) throw new Error(`Graph API ${path} failed: HTTP ${res.status}`);
  return res.json();
}

export async function getHealthOverviews(): Promise<any[]> {
  const now = Date.now();
  if (cachedOverviews && now - cachedOverviews.fetchedAt < OVERVIEW_TTL) {
    return cachedOverviews.data;
  }
  const data = await graphGet('/admin/serviceAnnouncement/healthOverviews');
  cachedOverviews = { data: data.value ?? [], fetchedAt: now };
  return cachedOverviews.data;
}

export async function getActiveIssues(): Promise<any[]> {
  const data = await graphGet('/admin/serviceAnnouncement/issues?$filter=isResolved%20eq%20false');
  return data.value ?? [];
}

export function mapGraphStatus(status: string): Severity {
  switch (status) {
    case 'serviceInterruption':    return 'major_outage';
    case 'serviceDegradation':
    case 'extendedRecovery':       return 'partial_outage';
    case 'investigating':
    case 'restoringService':
    case 'verifyingService':
    case 'investigationSuspended': return 'degraded';
    default:                       return 'operational';
  }
}

export function overallSeverity(severities: Severity[]): Severity {
  if (severities.includes('major_outage'))   return 'major_outage';
  if (severities.includes('partial_outage')) return 'partial_outage';
  if (severities.includes('degraded'))       return 'degraded';
  return 'operational';
}

export function stripHtml(html: string): string {
  return (html || '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
}
