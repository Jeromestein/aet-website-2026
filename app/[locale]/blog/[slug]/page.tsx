import type { Metadata } from 'next';
import Image from 'next/image';
import { hasLocale } from 'next-intl';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { routing } from '@/i18n/routing';
import { getPathname } from '@/i18n/navigation';
import { Navigation } from '@/components/navigation';
import { SiteFooter } from '@/components/site-footer';
import article from '@/content/blog/boston-foreign-credential-evaluation-services.en.json';
import styles from '@/components/blog/article.module.css';

type Props = { params: Promise<{ locale: string; slug: string }> };

const copy = {
  en: { back: 'Back to the blog', category: 'Credential evaluation', contents: 'In this article', sample: 'A sample evaluation report', sampleNote: 'Historical report sample from the original article. Names are anonymized; the addresses shown are historical. For current office details, visit Contact.', archive: 'View the original review screenshot', archiveNote: 'Historical screenshot from the original article; the rating and review count are not current figures.', evaluation: 'Explore evaluation services', contact: 'Contact our Boston office' },
  zh: { back: '返回博客', category: '学历认证', contents: '文章目录', sample: '学历评估报告示例', sampleNote: '原文所附历史报告示例，姓名已匿名处理；图中地址为历史信息，当前办公地址请查看联系页面。', archive: '查看原文中的历史评价截图', archiveNote: '此截图来自原文，评分及评价数量并非当前数据。', evaluation: '了解学历认证服务', contact: '联系波士顿办公室' },
  es: { back: 'Volver al blog', category: 'Evaluación de credenciales', contents: 'En este artículo', sample: 'Ejemplo de informe de evaluación', sampleNote: 'Ejemplo histórico del artículo original. Los nombres están anonimizados y las direcciones son históricas. Consulte Contacto para los datos actuales.', archive: 'Ver la captura original de reseñas', archiveNote: 'Captura histórica del artículo original; la puntuación y el número de reseñas no son cifras actuales.', evaluation: 'Explorar servicios de evaluación', contact: 'Contactar con la oficina de Boston' },
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, slug } = await params;
  if (!hasLocale(routing.locales, locale) || slug !== article.slug) notFound();
  return { title: article.title, description: article.description,
    robots: locale !== 'en' ? { index: false, follow: true } : undefined,
    openGraph: { title: article.title, description: article.description, type: 'article', locale: 'en_US' } };
}

export default async function BlogArticlePage({ params }: Props) {
  const { locale, slug } = await params;
  if (!hasLocale(routing.locales, locale) || slug !== article.slug) notFound();
  setRequestLocale(locale);
  const t = await getTranslations();
  const c = copy[locale];
  const index = <ol>{article.sections.map(section => <li key={section.id}><a href={`#${section.id}`} lang="en">{section.id === 'report-types' ? 'Types of evaluation reports' : section.title}</a></li>)}<li><a href="#report-sample">{c.sample}</a></li></ol>;
  return <>
    <a className="skip-link" href="#main-content">{t('home.skip')}</a>
    <Navigation />
    <main id="main-content" className={styles.page}>
      <header className={styles.hero}><div className="wrap">
        <a className={styles.back} href={getPathname({ locale, href: '/blog' })}><ArrowLeft size={17} aria-hidden="true" />{c.back}</a>
        <div className={styles.heroCopy}><span className="eyebrow">{c.category} · <span lang="en">Boston</span></span>
          <h1 lang="en">{article.title}</h1>
          <p lang="en">{article.description}</p>
        </div>
      </div></header>
      <div className={`wrap ${styles.layout}`}>
        <aside className={styles.sidebar}><nav aria-label={c.contents}><p>{c.contents}</p>{index}</nav>
          <a className={styles.serviceLink} href={getPathname({ locale, href: '/evaluation' })}>{c.evaluation}<ArrowRight size={18} aria-hidden="true" /></a>
        </aside>
        <div className={styles.body}>
          <details className={styles.mobileIndex}><summary>{c.contents}</summary><nav aria-label={c.contents}>{index}</nav></details>
          <article aria-label={article.title}>
            <div lang="en"><p className={styles.lead}>{article.intro}</p>
              {article.sections.map(section => <section className={styles.section} id={section.id} key={section.id} aria-labelledby={`${section.id}-title`}>
                <h2 id={`${section.id}-title`}>{section.title}</h2>
                {section.paragraphs?.map(paragraph => <p key={paragraph}>{paragraph}</p>)}
                {section.items && <ol className={styles.reportTypes}>{section.items.map((item, i) => {
                  const [title, ...body] = item.split(' – ');
                  return <li key={title}><span aria-hidden="true">0{i + 1}</span><div><h3>{title}</h3><p>{body.join(' – ')}</p></div></li>;
                })}</ol>}
              </section>)}
            </div>
            <section id="report-sample" className={styles.section} aria-labelledby="report-sample-title">
              <h2 id="report-sample-title">{c.sample}</h2>
              <figure className={styles.sample}><a href="/images/blog/boston-evaluation-sample.jpg" aria-label={c.sample}>
                <Image src="/images/blog/boston-evaluation-sample.jpg" alt="Anonymized historical educational credential evaluation report" width={740} height={880} sizes="(max-width: 760px) 90vw, 660px" />
              </a><figcaption>{c.sampleNote}</figcaption></figure>
              <details className={styles.archive}><summary>{c.archive}</summary><p>{c.archiveNote}</p>
                <Image src="/images/blog/boston-reviews-archive.jpg" alt="Historical Boston Google review screenshot from the original article" width={606} height={948} sizes="(max-width: 760px) 85vw, 480px" />
              </details>
            </section>
            <div className={styles.closing}><p lang="en">{article.closing}</p><a className="button" href={getPathname({ locale, href: '/contact' }) + '#boston'}>{c.contact}<ArrowRight size={17} aria-hidden="true" /></a></div>
          </article>
        </div>
      </div>
    </main>
    <SiteFooter />
  </>;
}
