'use client';

import type { AnchorHTMLAttributes } from 'react';
import type { Locale } from '@/i18n/routing';

type ArticleEvent = {
  event: 'blog_ai_click' | 'blog_ai_copy' | 'blog_contact_click';
  article_slug: string;
  article_locale: Locale;
  method: string;
  placement: 'intro' | 'ai' | 'closing';
};

export function recordArticleEvent(event: ArticleEvent) {
  // Queue click intent only. No analytics vendor, personal data, or lead claim.
  const browser = window as Window & { dataLayer?: Record<string, unknown>[] };
  browser.dataLayer ??= [];
  browser.dataLayer.push(event);
}

export function ArticleAction({ tracking, ...props }: AnchorHTMLAttributes<HTMLAnchorElement> & { tracking: ArticleEvent }) {
  return <a {...props} onClick={() => recordArticleEvent(tracking)} />;
}
