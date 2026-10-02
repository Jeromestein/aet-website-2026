import ApplicationShell from '@/components/evaluation-application/shell';
import { EvaluationAccess } from '@/components/evaluation-application/access';
export const metadata = { title: 'Application access — AET', robots: { index: false, follow: false }, referrer: 'no-referrer' as const };
export default async function Page({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  return <ApplicationShell locale={locale} languages={false}><EvaluationAccess /></ApplicationShell>;
}
