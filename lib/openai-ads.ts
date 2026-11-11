export const openAiPixelId = '61xTkMHzMkZ3dxGQ9wysWN';

type Pixel = ((...args: unknown[]) => void) & { q?: unknown[][] };
type PixelWindow = Pick<Window, 'location'> & { oaiq?: Pixel };

function isAdsHost(hostname: string) {
  return ['www.americantranslationservice.com', 'americantranslationservice.com'].includes(hostname);
}

// Only marketing pages are eligible. Application, payment, staff and customer
// routes must never produce advertising events or expose their URL parameters.
export function isAdsMarketingPage(pathname: string) {
  const path = pathname.replace(/^\/(en|zh|es)(?=\/|$)/, '').replace(/\/$/, '') || '/';
  return /^(\/|\/(about|contact|pricing|evaluation|certified-translation|technical-translation|interpretation|expert-opinion-letters|general-translation|notarization|visa-service|institutions|career)|\/blog(?:\/[^/]+)?|\/offices\/[^/]+)$/.test(path);
}

export function createOpenAiPageTracker() {
  let initialized = false;
  let previousPath: string | undefined;
  return (browser: PixelWindow, doc: Document, pathname: string) => {
    if (!isAdsHost(browser.location.hostname)) return;
    if (!isAdsMarketingPage(pathname)) {
      previousPath = undefined;
      return;
    }
    if (!initialized) {
      if (!browser.oaiq) {
        const queue: Pixel = (...args) => { queue.q!.push(args); };
        queue.q = [];
        browser.oaiq = queue;
        const script = doc.createElement('script');
        script.async = true;
        script.src = 'https://bzrcdn.openai.com/sdk/oaiq.min.js';
        script.id = 'openai-ads-sdk';
        doc.head.appendChild(script);
      }
      browser.oaiq('init', { pixelId: openAiPixelId });
      initialized = true;
    }
    if (previousPath === pathname) return;
    browser.oaiq?.('measure', 'page_viewed', {
      type: 'contents',
      contents: [{ id: pathname, content_type: 'page' }],
    });
    previousPath = pathname;
  };
}

// Match the actual formal-application destination, never CTA text or #process.
export function isFormalApplicationLink(href: string) {
  try {
    const url = new URL(href);
    return url.origin === 'https://app.americantranslationservice.com' &&
      !url.username && !url.password &&
      url.pathname.replace(/\/$/, '') === '/credential-evaluation-application';
  } catch {
    return false;
  }
}

export function createOpenAiApplicationClickHandler(browser: PixelWindow) {
  let lastClick: { path: string; time: number } | undefined;
  return (event: MouseEvent) => {
    try {
      // Keyboard activation also dispatches click with button 0. Preserve native
      // modifier/new-tab behavior, and count middle clicks but not context menus.
      if (event.defaultPrevented ||
        !((event.type === 'click' && event.button === 0) ||
          (event.type === 'auxclick' && event.button === 1))) return;
      const path = browser.location.pathname;
      if (!isAdsHost(browser.location.hostname) || !isAdsMarketingPage(path)) return;
      const target = event.target as Element | null;
      const link = target?.closest?.('a[href]');
      if (!link || link.hasAttribute('download') ||
        !isFormalApplicationLink(link.getAttribute('href') || '') || !browser.oaiq) return;
      const time = Date.now();
      if (lastClick?.path === path && time - lastClick.time < 1000) return;
      browser.oaiq('measure', 'custom', {
        type: 'custom',
        contents: [{ id: path, content_type: 'page' }],
      }, { custom_event_name: 'apply_online_clicked' });
      lastClick = { path, time };
    } catch {
      // Tracking must never prevent or delay application navigation.
    }
  };
}

export function listenForOpenAiApplicationClicks(browser: Window) {
  const handler = createOpenAiApplicationClickHandler(browser);
  // Run after link handlers, so cancelled clicks are not counted.
  browser.addEventListener('click', handler);
  browser.addEventListener('auxclick', handler);
  return () => {
    browser.removeEventListener('click', handler);
    browser.removeEventListener('auxclick', handler);
  };
}
