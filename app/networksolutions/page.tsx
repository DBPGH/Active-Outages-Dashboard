import ProviderDetailPage from '../components/ProviderDetailPage';

export default function NetworkSolutionsPage() {
  return (
    <ProviderDetailPage
      slug="networksolutions"
      providerName="Network Solutions"
      statusPageUrl="https://pulse.networksolutions.com"
      note="This provider's status page uses Cloudflare bot protection that blocks automated fetches. If status shows unavailable, please check the official status page directly."
    />
  );
}
