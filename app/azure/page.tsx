import ProviderDetailPage from '../components/ProviderDetailPage';

export default function AzurePage() {
  return (
    <ProviderDetailPage
      slug="azure"
      providerName="Microsoft Azure"
      icon={<span>🔷</span>}
      statusPageUrl="https://azure.status.microsoft"
    />
  );
}
