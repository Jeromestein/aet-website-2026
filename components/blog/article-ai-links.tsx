'use client';

import { useState } from 'react';
import { Copy } from 'lucide-react';
import { ArticleAction, recordArticleEvent } from './article-action';
import { authoredBlogCopy } from '@/lib/authored-blog-copy';
import type { Locale } from '@/i18n/routing';
import styles from './authored-article.module.css';

export function ArticleAiLinks({ slug, question, canonicalUrl, locale }: { slug: string; question: string; canonicalUrl: string; locale: Locale }) {
  const copy = authoredBlogCopy[locale];
  const c = copy.ai;
  const prompt = `${question}\n\n${copy.article}: ${canonicalUrl}`;
  const query = encodeURIComponent(prompt);
  const platforms = [
    { name: 'ChatGPT', id: 'chatgpt', href: `https://chatgpt.com/?q=${query}` },
    { name: 'Perplexity', id: 'perplexity', href: `https://www.perplexity.ai/search?q=${query}` },
    { name: c.google, id: 'google-ai', href: `https://www.google.com/search?udm=50&aep=11&q=${query}` },
    { name: 'Claude', id: 'claude', href: 'https://claude.ai/new' },
    { name: 'Grok', id: 'grok', href: 'https://grok.com/' },
  ];
  const [copied, setCopied] = useState(false);
  const [copyFailed, setCopyFailed] = useState(false);
  async function copyQuestion() {
    try {
      await navigator.clipboard.writeText(prompt);
      setCopied(true);
      setCopyFailed(false);
      recordArticleEvent({ event: 'blog_ai_copy', article_slug: slug, article_locale: locale, method: 'clipboard', placement: 'ai' });
    } catch {
      setCopyFailed(true);
    }
  }
  return <aside className={styles.ai} aria-labelledby="article-ai-title">
    <p id="article-ai-title" className={styles.aiTitle}>{c.title}</p>
    <ul>{platforms.map(platform => <li key={platform.id}>
      <ArticleAction href={platform.href} target="_blank" rel="noopener noreferrer"
        aria-label={c.open.replace('{platform}', platform.name)}
        tracking={{ event: 'blog_ai_click', article_slug: slug, article_locale: locale, method: platform.id, placement: 'ai' }}>
        {platform.name}
      </ArticleAction>
    </li>)}</ul>
    <p className={styles.aiHint}>{c.hint}</p>
    <details open={copyFailed || undefined}>
      <summary>{c.view}</summary>
      <label htmlFor="article-ai-question">{c.question}</label>
      <textarea id="article-ai-question" readOnly value={prompt} rows={5} />
      <button type="button" onClick={copyQuestion}><Copy size={16} aria-hidden="true" />{c.copy}</button>
      <span role="status">{copyFailed ? c.failed : copied ? c.copied : ''}</span>
    </details>
  </aside>;
}
