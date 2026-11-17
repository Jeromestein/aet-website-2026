import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { ArrowLeft, Mail, Monitor, Smartphone, ShieldCheck } from 'lucide-react';
import { staffSession } from '@/lib/staff/session';
import { AppError } from '@/lib/preeval/domain';
import StaffUnavailable from '@/components/staff/unavailable';
import EmailFrame from '@/components/email-preview/email-frame';
import { emailPreviewTemplates, sampleEmail } from '@/lib/email/preview';
import { emailPreviewEnabled } from '@/lib/email/preview-release';
import { emailAssetOrigin } from '@/lib/email/assets';
import s from './preview.module.css';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: 'Email Templates | AET Workspace', robots: { index: false, follow: false } };

export default async function EmailPreviewPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  if (!emailPreviewEnabled()) notFound();
  let current;
  try { current = await staffSession(); }
  catch (error) {
    if (error instanceof AppError && error.code === 'service_unavailable') return <StaffUnavailable />;
    throw error;
  }
  if (current?.role !== 'admin') redirect('/admin/login');
  const query = await searchParams;
  const selected = emailPreviewTemplates.find(item => item.id === query.kind) ?? emailPreviewTemplates[0];
  const mobile = query.view === 'mobile';
  const pending = query.scenario === 'pending';
  const formal = query.service === 'evaluation';
  const mail = await sampleEmail(selected.id, emailAssetOrigin(), pending, formal);
  function href(values: Record<string, string>) {
    return '/admin/email-preview?' + new URLSearchParams({ kind: selected.id, view: mobile ? 'mobile' : 'desktop', scenario: pending ? 'pending' : 'confirmed', service: formal ? 'evaluation' : 'pre-evaluation', ...values });
  }
  return <main className={s.page}>
    <header className={s.header}>
      <Link className={s.back} href="/admin/CRM"><ArrowLeft size={17} />Back to workspace</Link>
      <div className={s.titleRow}><div><p className={s.eyebrow}>AET WORKSPACE / TOOLS</p><h1>Email Templates<span>.</span></h1><p className={s.subtitle}>Every message, in one place. Preview the emails your clients receive.</p></div><span className={s.count}><Mail size={18} />{emailPreviewTemplates.length} email types</span></div>
    </header>
    <div className={s.layout}>
      <aside className={s.sidebar}><p className={s.eyebrow}>BUSINESS EMAILS</p><nav aria-label="Email templates">
        {emailPreviewTemplates.map((item, index) => <Link key={item.id} href={href({ kind: item.id })} scroll={false} aria-current={selected.id === item.id ? 'page' : undefined}><span className={s.number}>{String(index + 1).padStart(2, '0')}</span><span>{item.title}<small>{item.category}</small></span></Link>)}
      </nav><div className={s.safety}><ShieldCheck size={19} /><p>Fictional data only.<br /> Nothing is sent.<br /> Links inside emails are inactive.</p></div></aside>
      <section className={s.content} aria-label="Selected email preview">
        <div className={s.toolbar}><div><p className={s.eyebrow}>{selected.category}</p><h2>{selected.title}</h2><p className={s.description}>{selected.description}</p></div>
          <nav className={s.segment} aria-label="Preview width"><Link href={href({view:'desktop'})} scroll={false} aria-current={!mobile ? 'page' : undefined}><Monitor size={16} />Desktop</Link><Link href={href({view:'mobile'})} scroll={false} aria-current={mobile ? 'page' : undefined}><Smartphone size={16} />Mobile</Link></nav>
        </div>
        {selected.id === 'fee_update' && <nav className={s.variants} aria-label="Quote status"><span>Quote status</span><Link href={href({scenario:'confirmed'})} scroll={false} aria-current={!pending ? 'page' : undefined}>Confirmed</Link><Link href={href({scenario:'pending'})} scroll={false} aria-current={pending ? 'page' : undefined}>Under review</Link></nav>}
        {selected.id === 'information' && <nav className={s.variants} aria-label="Service version"><span>Service version</span><Link href={href({service:'pre-evaluation'})} scroll={false} aria-current={!formal ? 'page' : undefined}>Pre-evaluation</Link><Link href={href({service:'evaluation'})} scroll={false} aria-current={formal ? 'page' : undefined}>Credential evaluation</Link></nav>}
        <div className={s.subject}><span>SUBJECT</span><strong>{mail.subject}</strong></div>
        <div className={s.stage}><p className={s.frameLabel}>{mobile ? 'MOBILE · 390 PX' : 'DESKTOP · 600 PX EMAIL'}</p><EmailFrame key={selected.id + String(pending) + String(formal)} html={mail.html} title={selected.title} mobile={mobile} /></div>
        <p className={s.footnote}>Rendered from the same React Email templates used by the application. Appearance may vary between email clients.</p>
      </section>
    </div>
  </main>;
}
