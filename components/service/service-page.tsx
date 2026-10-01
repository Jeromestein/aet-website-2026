import { BreadcrumbStructuredData } from '@/components/breadcrumb-structured-data';
import type { ReactNode } from 'react';
import { getTranslations } from 'next-intl/server';
import { useLocale } from 'next-intl';
import { renderContactReferences } from '@/lib/contact-html';
import { getPathname } from '@/i18n/navigation';
import type { Locale } from '@/i18n/routing';
import { Navigation } from '@/components/navigation';
import { SiteFooter } from '@/components/site-footer';
import styles from './service-page.module.css';

/** Only reviewed, checked-in legacy content may use this renderer. */
export function ServiceCopy({ html, className = '' }: { html: string; className?: string }) {
  const locale = useLocale() as Locale;
  return <div className={`${styles.copy} ${className}`} dangerouslySetInnerHTML={{ __html: renderContactReferences(html, locale) }} />;
}

export async function ServicePage({ path, locale, title, titleLang, label, eyebrow, nav, actions, children }: {
  path: string; locale: Locale; title: string; titleLang?: string; label: string; eyebrow?: string;
  nav: { id: string; label: string; child?: boolean }[]; actions: { label: string; href: string }[]; children: ReactNode;
}) {
  const t = await getTranslations();
  return <>
    <BreadcrumbStructuredData path={path} locale={locale} title={label} />
    <a className="skip-link" href="#main-content">{t('home.skip')}</a>
    <Navigation />
    <main id="main-content" className={styles.page}>
      <header className={styles.hero}><div className="wrap"><div className={styles.heroInner}>
        <nav className={styles.breadcrumb} aria-label={t('pricing.breadcrumb')}>
          <a href={getPathname({ locale, href: '/' })}>{t('navigation.home')}</a><span aria-hidden="true">/</span><span aria-current="page">{label}</span>
        </nav>
        {eyebrow && <span className="eyebrow">{eyebrow}</span>}
        <h1 lang={titleLang}>{title}</h1>
        <div className={styles.actions}>{actions.map(action => <a key={action.href} className="button" href={action.href}>{action.label}</a>)}</div>
      </div></div></header>
      <div className={`wrap ${styles.layout}`}>
        <nav className={styles.index} aria-label={t('pricing.onPage')}>
          <p>{t('pricing.onPage')}</p>
          {nav.map((item, i) => <a key={item.id} className={item.child ? styles.indexChild : undefined} href={`#${item.id}`}>
            {!item.child && <span aria-hidden="true">{String(nav.slice(0, i + 1).filter(entry => !entry.child).length).padStart(2, '0')}</span>}{item.label}
          </a>)}
        </nav>
        <div className={styles.content}>{children}</div>
      </div>
    </main>
    <SiteFooter />
  </>;
}
