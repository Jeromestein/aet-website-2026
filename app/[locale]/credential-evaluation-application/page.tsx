import { requireApplicationPage } from '@/lib/application-page-access';
import { redirect } from 'next/navigation';
import { pathFor } from '@/lib/preeval/domain';
import { getTranslations } from 'next-intl/server';
export const dynamic = 'force-dynamic';
export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'evaluationApplication' });
  return { title: `${t('title')} | AET`, robots: { index: false, follow: false }, referrer: 'no-referrer' as const };
}
export default async function Page({ params }: { params: Promise<{ locale: string }> }) {
  requireApplicationPage(false);

  const { locale } = await params;
  redirect(pathFor(locale, '/application') + '?service=evaluation');
}
