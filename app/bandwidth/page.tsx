import ProviderDetailPage from '../components/ProviderDetailPage';

export default function BandwidthPage() {
  return (
    <ProviderDetailPage
      slug="bandwidth"
      providerName="Bandwidth"
      icon={<span>📡</span>}
      statusPageUrl="https://status.bandwidth.com"
    />
  );
}
