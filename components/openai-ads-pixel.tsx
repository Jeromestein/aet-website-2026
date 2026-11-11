'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { createOpenAiPageTracker } from '@/lib/openai-ads';

const trackPage = createOpenAiPageTracker();

export function OpenAiAdsPixel() {
  const pathname = usePathname();
  useEffect(() => {
    // Local development and hosted previews must not populate live ad reports.
    if (process.env.NODE_ENV !== 'production' || process.env.NEXT_PUBLIC_VERCEL_ENV === 'preview') return;
    try {
      trackPage(window, document, pathname);
    } catch {
      // A blocked SDK must never break the website.
    }
  }, [pathname]);
  return null;
}
