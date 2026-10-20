'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import Script from 'next/script';

const id = 'G-7SF10M7GBE';
export function SiteAnalytics() {
  const pathname = usePathname();
  const privatePage = /\/(?:status|documents)\/?$/.test(pathname);
  useEffect(() => {
    Object.assign(window, { [`ga-disable-${id}`]: privatePage });
  }, [privatePage]);
  if (privatePage) return null;
  return <>
    <Script id="google-analytics" strategy="afterInteractive">{`
      window.dataLayer = window.dataLayer || [];
      function gtag(){dataLayer.push(arguments);}
      gtag('js', new Date());
      var analyticsPage = new URL(window.location.href);
      analyticsPage.searchParams.delete('applicationId');
      var analyticsReferrer = document.referrer ? new URL(document.referrer) : null;
      if (analyticsReferrer) analyticsReferrer.searchParams.delete('applicationId');
      gtag('config', '${id}', {
        page_location: analyticsPage.href,
        page_referrer: analyticsReferrer ? analyticsReferrer.href : ''
      });
    `}</Script>
    <Script src={`https://www.googletagmanager.com/gtag/js?id=${id}`} strategy="afterInteractive" />
  </>;
}
