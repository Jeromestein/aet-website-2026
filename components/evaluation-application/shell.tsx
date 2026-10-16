import type { ReactNode } from 'react';
import { getTranslations } from 'next-intl/server';
import { Navigation } from '@/components/navigation';
import { SiteFooter } from '@/components/site-footer';
import s from './application.module.css';

export default async function ApplicationShell({ locale, children, languages = true }: { locale: string; children: ReactNode; languages?: boolean }) {
  const t = await getTranslations({ locale, namespace: 'evaluationApplication' });
  return <div className={s.page}>
    <a className={s.skip} href="#application-main">{t('skip')}</a>
    <Navigation allowLanguageSwitch={languages} />
    <main id="application-main" className={s.main}>{children}</main>
    <SiteFooter />
  </div>;
}
