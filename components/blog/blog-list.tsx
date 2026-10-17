'use client';

import { useState } from 'react';
import { ArrowUpRight, Search } from 'lucide-react';
import { articleTitle, articleUrl, topics, type BlogArticle, type BlogCopy, type BlogTopic } from '@/lib/blog';
import styles from './blog.module.css';
import type { Locale } from '@/i18n/routing';

export function BlogList({ articles, copy, locale }: { articles: BlogArticle[]; copy: BlogCopy; locale: Locale }) {
  const [query, setQuery] = useState('');
  const [topic, setTopic] = useState<BlogTopic | 'all'>('evaluation');
  const words = query.trim().toLocaleLowerCase().split(/\s+/).filter(Boolean);
  const visible = articles.filter(article => (topic === 'all' || article.topic === topic) &&
    words.every(word => `${articleTitle(article, locale)} ${article.title} ${article.slug.replaceAll('-', ' ')} ${article.city ?? ''} ${copy.topics[article.topic]}`.toLocaleLowerCase().includes(word)));
  const reset = () => { setQuery(''); setTopic('evaluation'); };

  return <section className={`wrap ${styles.library}`} aria-labelledby="articles-heading">
    <div className={styles.toolbar}>
      <h2 id="articles-heading">{topic === 'evaluation' ? copy.heading : topic === 'all' ? copy.all : copy.topics[topic]}</h2>
      <label className={styles.search}>
        <span className={styles.srOnly}>{copy.search}</span>
        <Search size={20} aria-hidden="true" />
        <input type="search" value={query} onChange={event => setQuery(event.target.value)} placeholder={copy.placeholder} aria-controls="blog-results" />
      </label>
    </div>
    <div className={styles.filters} role="group" aria-label={copy.all}>
      <button type="button" aria-pressed={topic === 'evaluation'} aria-controls="blog-results" onClick={() => setTopic('evaluation')}>{copy.topics.evaluation}</button>
      <label className={styles.otherTopics}><span>{copy.other}</span>
        <select aria-label={copy.other} aria-controls="blog-results" value={topic === 'evaluation' ? '' : topic} onChange={event => setTopic(event.target.value as BlogTopic | 'all')}>
          <option value="" disabled>{copy.other}</option>
          <option value="all">{copy.all}</option>
          {topics.filter(value => value !== 'evaluation').map(value => <option key={value} value={value}>{copy.topics[value]}</option>)}
        </select>
      </label>
    </div>
    <div className={styles.resultsMeta}>
      <p role="status" aria-live="polite" aria-atomic="true">{copy.count.replace('{count}', String(visible.length))}</p>
    </div>
    <div id="blog-results">
      {visible.length ? <ul className={styles.grid}>{visible.map(article => <li key={article.slug}>
        <article className={styles.card}>
          <div className={styles.cardMeta}><span>{copy.topics[article.topic]}</span><span lang={article.city ? 'en' : undefined}>{article.city ?? copy.general}</span></div>
          <h3 lang={article.titles?.[locale] ? (locale === 'zh' ? 'zh-Hans' : locale) : 'en'}><a href={articleUrl(article, locale)}>{articleTitle(article, locale)}</a></h3>
          <span className={styles.read} aria-hidden="true">{copy.read}<ArrowUpRight size={19} /></span>
        </article>
      </li>)}</ul> : <div className={styles.empty}><Search size={32} aria-hidden="true" /><h3>{copy.empty}</h3><p>{copy.emptyHint}</p><button type="button" className="button" onClick={reset}>{copy.reset}</button></div>}
    </div>
  </section>;
}
