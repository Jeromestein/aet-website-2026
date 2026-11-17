import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AppError } from '../lib/preeval/domain';
vi.mock('server-only', () => ({}));
vi.mock('../components/staff/unavailable', () => ({default: () => null}));
const auth = vi.hoisted(() => ({ session: vi.fn(), redirect: vi.fn((url: string) => { throw new Error('redirect:' + url); }) }));
vi.mock('../lib/staff/session', () => ({ staffSession: auth.session }));
vi.mock('next/navigation', () => ({ redirect: auth.redirect }));
import { emailPreviewTemplates, sampleEmail } from '../lib/email/preview';
import Page from '../app/[locale]/admin/email-preview/page';
import Unavailable from '../components/staff/unavailable';
const assets = 'https://www.americantranslationservice.com';
beforeEach(() => vi.clearAllMocks());
describe('staff email gallery', () => {
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
    expect(pending.html).not.toContain('Review Fee &amp; Payment Options');
  });
});
