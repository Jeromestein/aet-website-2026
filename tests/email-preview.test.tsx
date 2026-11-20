import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { AppError } from '../lib/preeval/domain';
vi.mock('server-only', () => ({}));
vi.mock('../components/staff/unavailable', () => ({default: () => null}));
const auth = vi.hoisted(() => ({ session: vi.fn(), redirect: vi.fn((url: string) => { throw new Error('redirect:' + url); }) }));
vi.mock('../lib/staff/session', () => ({ staffSession: auth.session }));
vi.mock('next/navigation', () => ({ redirect: auth.redirect, notFound: () => { throw new Error("not-found"); } }));
import { emailPreviewTemplates, sampleEmail } from '../lib/email/preview';
import Page from '../app/[locale]/admin/email-preview/page';
import Unavailable from '../components/staff/unavailable';
import { GET as legacyPreview } from '../app/api/email-template-preview/route';
const assets = 'https://www.americantranslationservice.com';
beforeEach(() => { vi.clearAllMocks(); vi.stubEnv('EMAIL_PREVIEW_ENABLED', 'true'); });
afterEach(() => vi.unstubAllEnvs());
describe('staff email gallery', () => {
  it.each([undefined, '', 'false', 'TRUE'])('blocks direct access when the flag is %s, before staff lookup', async value => {
    vi.stubEnv('EMAIL_PREVIEW_ENABLED', value);
    auth.session.mockResolvedValue({role:'admin'});
    await expect(Page({searchParams: Promise.resolve({kind:'report'})})).rejects.toThrow('not-found');
    expect(auth.session).not.toHaveBeenCalled();
  });
  it('allows an authenticated employee when explicitly enabled', async () => {
    auth.session.mockResolvedValue({role:'admin'});
    expect((await Page({searchParams: Promise.resolve({})})).type).toBe('main');
  });
  it('requires employee membership before accessing any preview variant', async () => {
    auth.session.mockResolvedValue(null);
    await expect(Page({ searchParams: Promise.resolve({kind:'report'}) })).rejects.toThrow('redirect:/admin/login');
    auth.session.mockResolvedValue({role:'customer'});
    await expect(Page({ searchParams: Promise.resolve({kind:'information',service:'evaluation'}) })).rejects.toThrow('redirect:/admin/login');
  });
  it('shows a recoverable state if staff verification is unavailable', async () => {
    auth.session.mockRejectedValue(new AppError('service_unavailable', 503));
    const page = await Page({searchParams: Promise.resolve({})});
    expect(page.type).toBe(Unavailable);
  });
  it('renders all eight categories with fictional application destinations', async () => {
    expect(new Set(emailPreviewTemplates.map(t => t.id)).size).toBe(8);
    for (const template of emailPreviewTemplates) {
      const mail = await sampleEmail(template.id, assets);
      expect(mail.subject).toBeTruthy();
      expect(mail.html).toContain('Sample');
      const links = [...mail.html.matchAll(/href="([^"#]+)"/g)].map(match => match[1]);
      expect(links.some(link => link.includes('264b791e-b806-4b52-b79e-5229b7224df0'))).toBe(true);
      expect(links.filter(link => !link.startsWith(assets) && new URL(link).origin !== 'https://preview.example.invalid')).toEqual([]);
    }
  });
  it('uses the formal workflow renderer for report and information variants', async () => {
    expect((await sampleEmail('report', assets)).html).toContain('Your Evaluation Report Is Ready');
    const formal = await sampleEmail('information', assets, false, true);
    const preliminary = await sampleEmail('information', assets);
    expect(formal.html).toContain('CREDENTIAL EVALUATION');
    expect(formal.html).toContain('final academic transcript');
    expect(preliminary.html).toContain('DEGREE EQUIVALENCY');
  });
  it('shows a pending quote without requesting payment', async () => {
    const pending = await sampleEmail('fee_update', assets, true);
    expect(pending.html).toContain('No payment is requested');
    expect(pending.html).not.toContain('View Fees');
  });
});

describe('legacy email preview bookmark', () => {
  it.each(['production', 'test'] as const)('returns 404 in %s without exposing templates', async mode => {
    vi.stubEnv('NODE_ENV', mode);
    const response = await legacyPreview(new Request('https://example.invalid/api/email-template-preview?raw=1'));
    expect(response.status).toBe(404);
    expect(await response.text()).toBe('');
    expect(response.headers.get('location')).toBeNull();
    expect(auth.session).not.toHaveBeenCalled();
  });
  it('redirects local bookmarks into the protected gallery and strips raw mode', async () => {
    vi.stubEnv('NODE_ENV', 'development');
    const response = await legacyPreview(new Request('http://localhost:3021/api/email-template-preview?raw=1&kind=report'));
    expect(response.status).toBe(307);
    expect(response.headers.get('location')).toBe('http://localhost:3021/admin/email-preview?kind=report');
    expect(response.headers.get('cache-control')).toContain('no-store');
    expect(response.headers.get('x-robots-tag')).toContain('noindex');
  });
});
