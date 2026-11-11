import { afterEach, describe, expect, it, vi } from 'vitest';
import { createOpenAiPageTracker, createOpenAiApplicationClickHandler, isAdsMarketingPage, isFormalApplicationLink, listenForOpenAiApplicationClicks, openAiPixelId } from '../lib/openai-ads';

describe('OpenAI advertising measurement boundaries', () => {
  it('allows localized marketing pages but excludes private and payment routes', () => {
    for (const path of ['/', '/zh', '/es/contact', '/blog/example', '/zh/offices/boston']) expect(isAdsMarketingPage(path)).toBe(true);
    for (const path of ['/application', '/zh/status', '/documents', '/payment', '/payment/result', '/admin/CRM', '/degree-equivalency-tool/application/success', '/unknown']) expect(isAdsMarketingPage(path)).toBe(false);
  });
  it('ignores local and preview hosts without loading the SDK', () => {
    const doc = { createElement: vi.fn() } as unknown as Document;
    for (const hostname of ['localhost', 'aet.vercel.app', 'app.americantranslationservice.com']) {
      createOpenAiPageTracker()({ location: { hostname } as Location }, doc, '/');
    }
    expect(doc.createElement).not.toHaveBeenCalled();
  });
  it('initializes once, tracks navigation once, and sends no query or contact data', () => {
    const oaiq = vi.fn();
    const browser = { location: { hostname: 'www.americantranslationservice.com', search: '?oppref=test&applicationId=private' } as Location, oaiq };
    const track = createOpenAiPageTracker();
    const doc = {} as Document;
    track(browser, doc, '/');
    track(browser, doc, '/');
    track(browser, doc, '/zh/contact');
    track(browser, doc, '/zh/status');
    track(browser, doc, '/zh/contact');
    expect(oaiq.mock.calls.filter(call => call[0] === 'init')).toEqual([['init', { pixelId: openAiPixelId }]]);
    expect(oaiq.mock.calls.filter(call => call[0] === 'measure')).toHaveLength(3);
    expect(JSON.stringify(oaiq.mock.calls)).not.toMatch(/applicationId|oppref|lead_created|private/);
  });
  it('queues the first event while loading a single asynchronous SDK', () => {
    const appendChild = vi.fn();
    const script = {};
    const doc = { createElement: () => script, head: { appendChild } } as unknown as Document;
    const browser = { location: { hostname: 'www.americantranslationservice.com' } as Location };
    const track = createOpenAiPageTracker();
    track(browser, doc, '/status');
    expect(appendChild).not.toHaveBeenCalled();
    track(browser, doc, '/');
    track(browser, doc, '/contact');
    expect(appendChild).toHaveBeenCalledTimes(1);
    expect(script).toMatchObject({ async: true, src: 'https://bzrcdn.openai.com/sdk/oaiq.min.js' });
    expect((browser as typeof browser & { oaiq: { q: unknown[] } }).oaiq.q).toHaveLength(3);
  });
});

describe('formal application click measurement', () => {
  const destination = 'https://app.americantranslationservice.com/credential-evaluation-application';
  const location = { hostname: 'www.americantranslationservice.com', pathname: '/zh/evaluation', search: '?email=private@example.com', hash: '#private' } as Location;
  function click(href = destination, options: Partial<MouseEvent> = {}, download = false) {
    // Model a nested label/icon resolving to its enclosing anchor.
    const link = { getAttribute: () => href, hasAttribute: () => download };
    return { type: 'click', button: 0, defaultPrevented: false,
      target: { closest: (selector: string) => selector === 'a[href]' ? link : null },
      ...options } as unknown as MouseEvent;
  }
  afterEach(() => vi.useRealTimers());

  it('matches only the HTTPS formal portal, including query/trailing slash variants', () => {
    for (const href of [destination, destination + '/', destination + '?source=website']) expect(isFormalApplicationLink(href)).toBe(true);
    for (const href of ['#process', '/#process', '/apply', destination + '/success',
      'https://app.americantranslationservice.com/degree-equivalency-tool',
      destination.replace('https:', 'http:'), destination.replace('.com/', '.com.evil.test/'),
      destination.replace('app.', 'user:pass@app.'), 'javascript:alert(1)']) expect(isFormalApplicationLink(href)).toBe(false);
  });

  it('sends the documented custom event with only the public source pathname', () => {
    const oaiq = vi.fn();
    const handler = createOpenAiApplicationClickHandler({ location, oaiq });
    const event = click(destination + '?applicationId=secret');
    handler(event);
    expect(oaiq).toHaveBeenCalledExactlyOnceWith('measure', 'custom', {
      type: 'custom', contents: [{ id: '/zh/evaluation', content_type: 'page' }],
    }, { custom_event_name: 'apply_online_clicked' });
    expect(event.defaultPrevented).toBe(false);
    expect(JSON.stringify(oaiq.mock.calls)).not.toMatch(/secret|private|email|applicationId|lead_created/);
  });

  it('suppresses rapid repeats across buttons, but counts later deliberate clicks', () => {
    vi.useFakeTimers();
    const oaiq = vi.fn();
    const handler = createOpenAiApplicationClickHandler({ location, oaiq });
    handler(click()); handler(click());
    vi.advanceTimersByTime(999); handler(click());
    expect(oaiq).toHaveBeenCalledTimes(1);
    vi.advanceTimersByTime(1); handler(click());
    expect(oaiq).toHaveBeenCalledTimes(2);
  });

  it('supports keyboard, modifier and middle clicks without changing navigation', () => {
    for (const options of [{ detail: 0 }, { metaKey: true }, { ctrlKey: true }, { shiftKey: true }, { type: 'auxclick', button: 1 }]) {
      const oaiq = vi.fn();
      const event = click(destination, options);
      createOpenAiApplicationClickHandler({ location, oaiq })(event);
      expect(oaiq).toHaveBeenCalledTimes(1);
      expect(event.defaultPrevented).toBe(false);
    }
  });

  it('ignores cancelled, right-button, download and non-link actions', () => {
    const oaiq = vi.fn();
    const handler = createOpenAiApplicationClickHandler({ location, oaiq });
    for (const event of [click(destination, { defaultPrevented: true }), click(destination, { type: 'auxclick', button: 2 }),
      click(destination, {}, true), click('#process'), click(destination, { target: null }),
      click(destination, { target: {} as EventTarget })]) handler(event);
    expect(oaiq).not.toHaveBeenCalled();
  });

  it('checks the current host and route on every click, excluding private pages', () => {
    const oaiq = vi.fn();
    const browser = { location: { ...location }, oaiq };
    const handler = createOpenAiApplicationClickHandler(browser);
    for (const pathname of ['/status', '/application', '/payment', '/admin/CRM']) {
      browser.location.pathname = pathname; handler(click());
    }
    browser.location.pathname = '/evaluation';
    for (const hostname of ['localhost', 'aet.vercel.app', 'app.americantranslationservice.com']) {
      browser.location.hostname = hostname; handler(click());
    }
    expect(oaiq).not.toHaveBeenCalled();
    browser.location.hostname = 'americantranslationservice.com'; handler(click());
    expect(oaiq).toHaveBeenCalledTimes(1);
  });

  it('tolerates unavailable/throwing SDKs and queues clicks while the SDK loads', () => {
    expect(() => createOpenAiApplicationClickHandler({ location })(click())).not.toThrow();
    expect(() => createOpenAiApplicationClickHandler({ location, oaiq: () => { throw new Error('blocked'); } })(click())).not.toThrow();
    const browser = { location };
    const doc = { createElement: () => ({}), head: { appendChild: vi.fn() } } as unknown as Document;
    createOpenAiPageTracker()(browser, doc, location.pathname);
    createOpenAiApplicationClickHandler(browser)(click());
    expect((browser as typeof browser & { oaiq: { q: unknown[][] } }).oaiq.q.at(-1)).toEqual([
      'measure', 'custom', { type: 'custom', contents: [{ id: location.pathname, content_type: 'page' }] },
      { custom_event_name: 'apply_online_clicked' },
    ]);
  });

  it('cleans up both delegated listeners on unmount', () => {
    const browser = { addEventListener: vi.fn(), removeEventListener: vi.fn() };
    const cleanup = listenForOpenAiApplicationClicks(browser as unknown as Window);
    const handler = browser.addEventListener.mock.calls[0][1];
    expect(browser.addEventListener.mock.calls).toEqual([['click', handler], ['auxclick', handler]]);
    cleanup();
    expect(browser.removeEventListener.mock.calls).toEqual([['click', handler], ['auxclick', handler]]);
  });
});
