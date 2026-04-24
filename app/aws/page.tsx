import ProviderDetailPage from '../components/ProviderDetailPage';

export default function AWSPage() {
  return (
    <ProviderDetailPage
      slug="aws"
      providerName="Amazon Web Services"
      statusPageUrl="https://status.aws.amazon.com"
    />
  );
}
