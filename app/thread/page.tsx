import ProviderDetailPage from '../components/ProviderDetailPage';

export default function ThreadPage() {
  return (
    <ProviderDetailPage
      slug="thread"
      providerName="Thread"
      icon={<span>🧵</span>}
      statusPageUrl="https://status.getthread.com"
    />
  );
}
