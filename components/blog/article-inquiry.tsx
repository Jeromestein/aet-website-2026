import { MessageCircle, Phone, SquarePen } from 'lucide-react';
import { getOffice, phoneHref, contactPath } from '@/lib/contact';
import { authoredBlogCopy } from '@/lib/authored-blog-copy';
import type { AuthoredPost } from '@/lib/authored-blog-posts';
import type { Locale } from '@/i18n/routing';
import { ArticleAction } from './article-action';
import styles from './authored-article.module.css';

const application = 'https://app.americantranslationservice.com/credential-evaluation-application';

export function ArticleInquiry({ post, locale }: { post: AuthoredPost; locale: Locale }) {
  const c = post.inquiry;
  const copy = authoredBlogCopy[post.locale];
  const office = getOffice(c.office);
  const tracking = { event: 'blog_contact_click' as const, article_slug: post.slug, article_locale: post.locale, placement: 'closing' as const };
  return <section id="contact" aria-labelledby="contact-title" className={styles.inquiry}>
    <h2 id="contact-title">{c.title}</h2>
    <p>{c.introduction}</p>
    <ul>{c.details.map(detail => <li key={detail}>{detail}</li>)}</ul>
    <div className={styles.actions}>
      <ArticleAction className="button" href={phoneHref(office.phones[0])} tracking={{ ...tracking, method: 'phone' }}><Phone size={19} aria-hidden="true" />{copy.phone.replace('{phone}', office.phones[0])}</ArticleAction>
      <ArticleAction className="button" href={contactPath(locale, c.office)} tracking={{ ...tracking, method: 'contact_page' }}><MessageCircle size={19} aria-hidden="true" />{copy.contact}</ArticleAction>
      <ArticleAction className={`button ${styles.primary}`} href={application} tracking={{ ...tracking, method: 'application' }}><SquarePen size={19} aria-hidden="true" />{copy.apply}</ArticleAction>
    </div>
    <p className={styles.notice}>{c.notice}</p>
  </section>;
}
