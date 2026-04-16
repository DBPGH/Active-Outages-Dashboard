import ProviderDetailPage from '../components/ProviderDetailPage';

export default function CloudflarePage() {
  return (
    <ProviderDetailPage
      slug="cloudflare"
      providerName="Cloudflare"
      icon={<span>🌐</span>}
      statusPageUrl="https://www.cloudflarestatus.com"
    />
  );
}
