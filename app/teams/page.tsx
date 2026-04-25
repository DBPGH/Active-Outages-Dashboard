import ProviderDetailPage from '../components/ProviderDetailPage';

export default function TeamsPage() {
  return (
    <ProviderDetailPage
      slug="teams"
      providerName="Microsoft Teams"
      statusPageUrl="https://status.cloud.microsoft"
      note="Reflects overall M365 enterprise health — no public per-service API available."
    />
  );
}
