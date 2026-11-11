import { describe, expect, it, vi } from 'vitest';
import { createOpenAiPageTracker, isAdsMarketingPage, openAiPixelId } from '../lib/openai-ads';

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
