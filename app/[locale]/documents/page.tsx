import type { Metadata } from 'next';
import { connection } from 'next/server';
import { hasLocale } from 'next-intl';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { routing } from '@/i18n/routing';
import { ServicePage } from '@/components/service/service-page';
import { DocumentsAccess } from '@/components/documents/file-manager';
import { documentsEnabled } from '@/lib/dropbox/server';

type Props = { params: Promise<{ locale: string }> };
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  const t = await getTranslations({ locale, namespace: 'documents' });
  return { title: t('title'), description: t('intro'), robots: { index: false, follow: false }, referrer: 'no-referrer' };
}
export default async function DocumentsPage({ params }: Props) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);
  await connection();
  const t = await getTranslations('documents');
  return <ServicePage path="/documents" locale={locale} title={t('title')} label={t('title')} eyebrow={t('eyebrow')}
    nav={[{ id: 'documents', label: t('title') }]} actions={[]}>
    <section id="documents"><DocumentsAccess enabled={documentsEnabled()} /></section>
  </ServicePage>;
}
