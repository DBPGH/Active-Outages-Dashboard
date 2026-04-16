import ProviderDetailPage from '../components/ProviderDetailPage';

export default function SharePointPage() {
  return (
    <ProviderDetailPage
      slug="sharepoint"
      providerName="SharePoint Online"
      icon={<span>📂</span>}
      statusPageUrl="https://status.cloud.microsoft"
      note="Status reflects overall M365 enterprise health. Granular per-service data requires M365 admin credentials."
    />
  );
}
