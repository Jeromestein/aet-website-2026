import { getTranslations } from 'next-intl/server';
import ApplicationShell from '@/components/evaluation-application/shell';
import { EvaluationApplication } from '@/components/evaluation-application/form';
export const dynamic = 'force-dynamic';
export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'evaluationApplication' });
  return { title: `${t('title')} | AET`, robots: { index: false, follow: false }, referrer: 'no-referrer' as const };
}
export default async function Page({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  return <ApplicationShell locale={locale}><EvaluationApplication locale={locale} enabled={process.env.PREEVAL_ENV === 'local'} /></ApplicationShell>;
}
