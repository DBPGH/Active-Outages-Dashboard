import ProviderDetailPage from '../components/ProviderDetailPage';

export default function EntraPage() {
  return (
    <ProviderDetailPage
      slug="entra"
      providerName="Microsoft Entra ID"
      icon={<span>🔐</span>}
      statusPageUrl="https://azure.status.microsoft/en-us/status/"
    />
  );
}
