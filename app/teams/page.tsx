import ProviderDetailPage from '../components/ProviderDetailPage';

export default function TeamsPage() {
  return (
    <ProviderDetailPage
      slug="teams"
      providerName="Microsoft 365"
      icon={<span>🪟</span>}
      statusPageUrl="https://status.cloud.microsoft"
      note="Status reflects overall M365 enterprise health. Granular per-service data requires M365 admin credentials."
    />
  );
}
