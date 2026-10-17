import type { Metadata } from 'next';
import { Navigation } from '@/components/navigation';
import { SiteFooter } from '@/components/site-footer';
import { StatusPage } from '@/components/customer-status/status-page';
import { statusCopy } from '@/lib/customer-status/copy';
import type { Locale } from '@/i18n/routing';
type Props = { params: Promise<{locale: Locale}>; searchParams: Promise<{applicationId?: string | string[];source?:string}> };
export async function generateMetadata({params}: Props): Promise<Metadata> {
  const {locale} = await params;
  return {title: statusCopy[locale].title + ' | AET', robots:{index:false,follow:false},referrer:'no-referrer'};
}
export default async function Page({params,searchParams}: Props) {
  const [{locale},query] = await Promise.all([params,searchParams]);
  return <><Navigation /><StatusPage preview={query.source==='preview'} locale={locale} initialId={typeof query.applicationId === 'string' ? query.applicationId : ''} /><SiteFooter /></>;
}
