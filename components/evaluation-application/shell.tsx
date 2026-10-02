import type { ReactNode } from 'react';
import { getTranslations } from 'next-intl/server';
import ApplicationLanguages from './languages';
import { pathFor } from '@/lib/preeval/domain';
import s from './application.module.css';

export default async function ApplicationShell({ locale, children, search = '', languages = true }: { locale: string; children: ReactNode; search?: string; languages?: boolean }) {
  const t = await getTranslations({ locale, namespace: 'evaluationApplication' });
  return <div className={s.page}>
    <a className={s.skip} href="#application-main">{t('skip')}</a>
    <header className={s.header}>
      <a href={pathFor(locale, '/')}><img src="/brand/aet-logo-header.svg" width="250" height="58" alt="American Education and Translation Services,CORP (AET)" /></a>
      <nav aria-label={t('navigation')}><a href={pathFor(locale, '/evaluation')}>{t('about')}</a>{languages && <ApplicationLanguages locale={locale} search={search} />}</nav>
    </header>
    <main id="application-main" className={s.main}>{children}</main>
    <footer className={s.footer}><span>American Education and Translation Services, CORP (AET)</span><span><a href="/privacy">{t('privacy')}</a> · <a href="/terms">{t('termsLink')}</a></span></footer>
  </div>;
}
