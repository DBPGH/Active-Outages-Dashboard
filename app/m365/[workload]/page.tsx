import ProviderDetailPage from '../../components/ProviderDetailPage';

interface Props {
  params: Promise<{ workload: string }>;
}

export default async function M365ServicePage({ params }: Props) {
  const { workload } = await params;
  return (
    <ProviderDetailPage
      slug={`m365/${workload}`}
      providerName={workload}
      statusPageUrl="https://admin.microsoft.com/adminportal/home#/servicehealth"
    />
  );
}
