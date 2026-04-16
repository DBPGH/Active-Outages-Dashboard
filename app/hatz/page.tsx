import ProviderDetailPage from '../components/ProviderDetailPage';

export default function HatzPage() {
  return (
    <ProviderDetailPage
      slug="hatz"
      providerName="Hatz.ai"
      icon={<span>🤖</span>}
      statusPageUrl="https://status.hatz.ai"
    />
  );
}
