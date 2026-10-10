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
  // Retain the article click queue without personal data or a completed-lead claim.
  const browser = window as Window & { dataLayer?: Record<string, unknown>[] };
  browser.dataLayer ??= [];
  browser.dataLayer.push(event);
}

export function ArticleAction({ tracking, onClick, ...props }: AnchorHTMLAttributes<HTMLAnchorElement> & { tracking: ArticleEvent }) {
  return <a {...props} onClick={(event) => {
    onClick?.(event);
    if (event.defaultPrevented) return;
    recordArticleEvent(tracking);

    if (tracking.event !== 'blog_contact_click' ||
      (tracking.method !== 'phone' && tracking.method !== 'contact_page')) return;

    const browser = window as Window & {
      gtag?: (command: 'event', name: string, parameters: Record<string, unknown>) => void;
    };
    if (typeof browser.gtag !== 'function') return;

    const link = event.currentTarget;
    // Keep telephone launches, new tabs, downloads and modified clicks native.
    const delayNavigation = event.button === 0 &&
      !event.metaKey && !event.ctrlKey && !event.shiftKey && !event.altKey &&
      (!link.target || link.target === '_self') && !link.hasAttribute('download') &&
      (link.protocol === 'http:' || link.protocol === 'https:');
    const destination = link.href;
    let finished = false;
    let timer: number | undefined;
    const navigate = () => {
      if (finished) return;
      finished = true;
      if (timer !== undefined) window.clearTimeout(timer);
      window.location.assign(destination);
    };

    // gtag's timeout cannot run when its loader is blocked, so keep our own.
    if (delayNavigation) timer = window.setTimeout(navigate, 2000);
    try {
      browser.gtag('event', 'contact_us', {
        article_slug: tracking.article_slug,
        article_locale: tracking.article_locale,
        method: tracking.method,
        placement: tracking.placement,
        ...(delayNavigation ? { event_callback: navigate, event_timeout: 2000 } : {}),
      });
      if (delayNavigation) event.preventDefault();
    } catch {
      // Analytics failure must not prevent the link's normal navigation.
      finished = true;
      if (timer !== undefined) window.clearTimeout(timer);
    }
  }} />;
}
