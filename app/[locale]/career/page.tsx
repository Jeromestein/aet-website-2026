import type { Metadata } from 'next';
import { hasLocale } from 'next-intl';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { ChevronDown, Globe2, GraduationCap, Handshake, Users } from 'lucide-react';
import { routing } from '@/i18n/routing';
import { ServicePage } from '@/components/service/service-page';
import { CardRail } from '@/components/card-rail';
import { localizeContactLinks } from '@/lib/contact';
import content from '@/content/career/en.json';
import copyStyles from '@/components/service/service-page.module.css';
import styles from './career.module.css';

type Props = { params: Promise<{ locale: string }> };

export const metadata: Metadata = {
  title: 'Careers',
  description: 'Join the AET team! Explore rewarding careers in education and translation. Unlock growth opportunities and contribute to our dynamic work environment.',
};

const benefitIcons = [Users, GraduationCap, Globe2, Handshake];

export default async function CareerPage({ params }: Props) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);
  const t = await getTranslations();
  // Career copy must stay verbatim, including historical address spellings.
  // Only local Contact destinations are adapted to the active site language.
  function CareerCopy({ html, className = '' }: { html: string; className?: string }) {
    return <div className={`${copyStyles.copy} ${className}`}
      dangerouslySetInnerHTML={{ __html: localizeContactLinks(html, locale as 'en' | 'zh' | 'es') }} />;
  }
  const nav = [
    ...content.groups.map(group => ({ id: group.id, label: group.title })),
    { id: 'benefits', label: content.benefits.title },
    { id: 'apply', label: content.apply.title },
  ];

  return <ServicePage locale={locale} title={content.title} titleLang="en"
    label={t('footer.career')} eyebrow={content.eyebrow} nav={nav} actions={[]}>
    <div lang="en" className={styles.body}>
      <CareerCopy html={content.introHtml} className={styles.intro} />
      {content.groups.map(group => <section key={group.id} id={group.id} className={styles.section} aria-labelledby={`${group.id}-title`}>
        <h2 id={`${group.id}-title`}>{group.title}</h2>
        <div className={styles.jobs}>
          {group.jobs.map(job => <details key={job.id} id={job.id} className={styles.job}>
            <summary><h3>{job.title}</h3><ChevronDown size={22} aria-hidden="true" /></summary>
            <CareerCopy html={job.html} className={styles.description} />
          </details>)}
        </div>
      </section>)}
      <section id="benefits" className={styles.section} aria-labelledby="benefits-title">
        <h2 id="benefits-title">{content.benefits.title}</h2>
        <CardRail className={styles.benefits} label={content.benefits.title}>
          {content.benefits.items.map((item, index) => {
            const Icon = benefitIcons[index];
            return <article key={item.title} data-rail-card className={styles.benefit}>
              <Icon size={28} aria-hidden="true" />
              <h3>{item.title}</h3><CareerCopy html={item.html} />
            </article>;
          })}
        </CardRail>
      </section>
      <section id="apply" className={styles.section} aria-labelledby="apply-title">
        <h2 id="apply-title">{content.apply.title}</h2>
        <CareerCopy html={content.apply.html} className={styles.application} />
      </section>
      <section className={styles.closing}>
        <h2 dangerouslySetInnerHTML={{ __html: localizeContactLinks(content.closing.headingHtml, locale) }} />
        <CareerCopy html={content.closing.html} />
      </section>
    </div>
  </ServicePage>;
}
