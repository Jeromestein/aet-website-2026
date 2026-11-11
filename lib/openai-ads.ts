export const openAiPixelId = '61xTkMHzMkZ3dxGQ9wysWN';

type Pixel = ((...args: unknown[]) => void) & { q?: unknown[][] };
type PixelWindow = Pick<Window, 'location'> & { oaiq?: Pixel };

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
    if (!['www.americantranslationservice.com', 'americantranslationservice.com'].includes(browser.location.hostname)) return;
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
