import { requireApplicationPage } from '@/lib/application-page-access';
import { redirect } from 'next/navigation';
import { pathFor } from '@/lib/preeval/domain';
export const dynamic = 'force-dynamic';
export default async function Apply({ params }: { params: Promise<{ locale: string }> }) {
  requireApplicationPage(false);

  const { locale } = await params;
  redirect(pathFor(locale, '/application') + '?service=evaluation');
}
