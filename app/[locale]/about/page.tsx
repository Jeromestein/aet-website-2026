import { graph, organizationSchema } from '@/lib/structured-data';
import { StructuredData } from '@/components/structured-data';
import { pageMetadata } from '@/lib/seo';
import type { Metadata } from 'next';
import Image from 'next/image';
import { hasLocale } from 'next-intl';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { ArrowRight, Check } from 'lucide-react';
import { routing } from '@/i18n/routing';
import { getPathname } from '@/i18n/navigation';
import { ServicePage } from '@/components/service/service-page';
import { CardRail } from '@/components/card-rail';
import { aboutContent, aboutPhotos } from '@/lib/about-content';
import styles from './about.module.css';

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  const { title, description } = aboutContent[locale];
  return pageMetadata({ path: '/about', locale, title, description });
}

export default async function AboutPage({ params }: Props) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);
  const t = await getTranslations();
  const c = aboutContent[locale];
  const contact = getPathname({ locale, href: '/contact' });

  return <ServicePage path={'/about'} locale={locale} title={c.title} label={t('footer.about')} eyebrow={c.eyebrow}
    nav={Object.entries(c.sections).map(([id, label]) => ({ id, label }))}
    actions={[{ label: t('home.hero.apply'), href: 'https://app.americantranslationservice.com/credential-evaluation-application' },
      { label: t('home.contact'), href: contact }]}>
    <StructuredData data={graph([organizationSchema()])} />
    <p className={styles.intro}>{c.intro}</p>
    <section id="history" className={styles.section} aria-labelledby="history-title">
      <h2 id="history-title">{c.sections.history}</h2>
      <ol className={styles.timeline}>{c.timeline.map((event, i) => <li key={`${event.year}-${i}`}>
        <time dateTime={event.year}>{event.year}</time>
        <div><p>{event.body}</p>{event.href && <a href={event.href}>{event.linkLabel}<ArrowRight size={16} aria-hidden="true" /></a>}</div>
      </li>)}</ol>
    </section>
    <section id="highlights" className={styles.section} aria-labelledby="highlights-title">
      <h2 id="highlights-title">{c.sections.highlights}</h2>
      <CardRail className={styles.highlights} label={c.sections.highlights}>{c.highlights.map(item => <article data-rail-card key={item.title} className={styles.highlight}>
        <Check size={22} aria-hidden="true" /><h3>{item.title}</h3><p>{item.body}</p>
      </article>)}</CardRail>
    </section>
    <section id="photos" className={styles.section} aria-labelledby="photos-title">
      <h2 id="photos-title">{c.sections.photos}</h2>
      <p className={styles.note}>{c.photoNote} <a href={contact}>{t('home.contact')}</a></p>
      <CardRail className={styles.photos} label={c.sections.photos}>{aboutPhotos.map((photo, i) => <figure data-rail-card key={photo.src} className={styles.photo}>
        <a href={photo.src} aria-label={c.viewPhoto.replace('{name}', c.photos[i])}>
          <Image src={photo.src} alt={c.photos[i]} width={photo.width} height={photo.height} sizes="(max-width: 760px) 85vw, (max-width: 1000px) 45vw, 28vw" />
        </a><figcaption>{c.photos[i]}</figcaption>
      </figure>)}</CardRail>
    </section>
    <section id="clients" className={styles.section} aria-labelledby="clients-title">
      <h2 id="clients-title">{c.sections.clients}</h2>
      <div className={styles.clients}><Image src="/images/about/clients.png" alt={c.clientsAlt} width={948} height={624} sizes="(max-width: 760px) 90vw, 850px" /></div>
    </section>
    <div className={styles.resources}>
      <section id="testimonials" aria-labelledby="about-testimonials-title"><h2 id="about-testimonials-title">{c.sections.testimonials}</h2>
        <a href={`${getPathname({ locale, href: '/' })}#stories`}>{c.testimonialsLink}<ArrowRight size={18} aria-hidden="true" /></a>
      </section>
      <section id="careers" aria-labelledby="careers-title"><h2 id="careers-title">{c.sections.careers}</h2>
        <a href={getPathname({ locale, href: '/career' })}>{c.careersLink}<ArrowRight size={18} aria-hidden="true" /></a>
      </section>
    </div>
  </ServicePage>;
}
