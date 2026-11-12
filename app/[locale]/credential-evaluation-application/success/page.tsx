import { requireApplicationPage } from '@/lib/application-page-access';
import ApplicationShell from '@/components/evaluation-application/shell';
import { ApplicationReceipt } from '@/components/evaluation-application/receipt';
export { generateMetadata } from '../page';
export default async function Page({ params, searchParams }: { params: Promise<{ locale: string }>; searchParams: Promise<{ id?: string }> }) {
  requireApplicationPage(false);

  const { locale } = await params;
  const { id } = await searchParams;
  return <ApplicationShell locale={locale}><ApplicationReceipt locale={locale} id={id ?? ''} /></ApplicationShell>;
}
