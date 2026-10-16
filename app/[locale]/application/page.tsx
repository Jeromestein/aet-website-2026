import type { Metadata } from 'next';
import { Navigation } from '@/components/navigation';
import { SiteFooter } from '@/components/site-footer';
import { GeneralApplication } from '@/components/application/form';
import { applicationCopy } from '@/lib/application/copy';
import { serviceFromQuery } from '@/lib/application/model';
import type { Locale } from '@/i18n/routing';
import s from '@/components/application/application.module.css';

type Props = { params: Promise<{ locale: Locale }>; searchParams: Promise<{ service?: string | string[] }> };
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  return { title: applicationCopy[locale].title + ' | AET', robots: { index: false, follow: false }, referrer: 'no-referrer' };
}
export default async function ApplicationPage({ params, searchParams }: Props) {
  const [{ locale }, query] = await Promise.all([params, searchParams]);
  return <>
    <a className={s.skip} href="#application-main">{applicationCopy[locale].skip}</a>
    <Navigation />
    <main id="application-main" className={s.main}>
      <GeneralApplication locale={locale} initialService={serviceFromQuery(query.service)} />
    </main>
    <SiteFooter />
  </>;
}
