import ProviderDetailPage from '../components/ProviderDetailPage';

export default function MicrosoftPage() {
  return (
    <ProviderDetailPage
      slug="microsoft"
      providerName="Microsoft 365"
      icon={<span>🪟</span>}
      statusPageUrl="https://status.microsoft.com"
    />
  );
}
