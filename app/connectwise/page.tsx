import ProviderDetailPage from '../components/ProviderDetailPage';

export default function ConnectWisePage() {
  return (
    <ProviderDetailPage
      slug="connectwise"
      providerName="ConnectWise"
      icon={<span>🔧</span>}
      statusPageUrl="https://status.connectwise.com"
    />
  );
}
