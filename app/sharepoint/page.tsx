import ProviderDetailPage from '../components/ProviderDetailPage';

export default function SharePointPage() {
  return (
    <ProviderDetailPage
      slug="sharepoint"
      providerName="SharePoint"
      statusPageUrl="https://status.cloud.microsoft"
      note="Reflects overall M365 enterprise health — no public per-service API available."
    />
  );
}
