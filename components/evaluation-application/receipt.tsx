'use client';
import { useEffect, useState, useRef, type FormEvent } from 'react';
import { useTranslations } from 'next-intl';
import { Check, Printer, Upload, RefreshCw, FileDown } from 'lucide-react';
import type { ApplicationRecord } from '@/lib/evaluation-application/workflow';
import { evaluationApi } from './api';
import { ApplicationDetails } from './details';
import { QuoteSummary } from './summary';
import s from './application.module.css';
export function ApplicationReceipt({ locale, id }: { locale: string; id: string }) {
  const t = useTranslations('evaluationApplication'); const w = useTranslations('evaluationWorkflow');
  const [record, setRecord] = useState<ApplicationRecord | null>(null); const [failed, setFailed] = useState(false);
  const [busy, setBusy] = useState(false); const [error, setError] = useState(''); const [notice, setNotice] = useState(''); const [cancelPrompt, setCancelPrompt] = useState(false);
  const lock = useRef(false); const prefix = `applications/${encodeURIComponent(id)}`;
  async function load(signal?: AbortSignal) { setRecord(await evaluationApi<ApplicationRecord>(prefix, undefined, signal)); }
  useEffect(() => {
    const controller = new AbortController(); setFailed(false);
    async function start() {
      if (new URLSearchParams(location.search).get('checkout') === 'success') {
        try { await evaluationApi(prefix + '/reconcile', {}, controller.signal); } catch (e) { if ((e as Error).name === 'AbortError') return; }
      }
      await load(controller.signal);
    }
    start().catch(e => { if (e.name !== 'AbortError') setFailed(true); });
    return () => controller.abort();
  }, [id]);
  async function run(action: () => Promise<void>) {
    if (lock.current) return; lock.current = true; setBusy(true); setError(''); setNotice('');
    try { await action(); await load(); } catch (e) { const code = (e as Error).message; setError(w.has('errors.' + code) ? w('errors.' + code) : w('errors.service_unavailable')); }
    finally { lock.current = false; setBusy(false); }
  }
  async function upload(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); const form = event.currentTarget; const data = new FormData(form); const file = data.get('file');
    if (!(file instanceof File) || !file.size || file.size > 20 * 1024 * 1024) { setError(w('errors.invalid_file')); return; }
    await run(async () => { await evaluationApi(prefix + '/files', data); form.reset(); setNotice(w('uploaded')); });
  }
  const money = (cents: number) => new Intl.NumberFormat(locale === 'zh' ? 'zh-CN' : locale === 'es' ? 'es-US' : 'en-US', { style: 'currency', currency: 'USD' }).format(cents / 100);
  if (failed) return <section className={s.receipt}><h1>{t('receiptUnavailable')}</h1><p>{t('receiptError')}</p><a href={`${locale === 'en' ? '' : '/' + locale}/contact`}>{w('contact')}</a></section>;
  if (!record) return <p role="status">{t('loading')}</p>;
  const locked = ['cancelled', 'completed'].includes(record.status);
  return <div className={s.receipt}>
    <section className={s.panel}><div className={s.successIcon}><Check aria-hidden="true" /></div><p className={s.eyebrow}>{t('receivedLabel')}</p><h1>{w('title')}</h1><p className={s.hint}>{t('receivedNote')}</p>
      <p className={s.receiptId}><strong>{t('reference')}</strong><br />{record.id}</p>
      <div className={s.statusRow}><span className={s.badge}>{w('status.' + record.status)}</span><span className={s.badge}>{w('payment.' + record.payment_status)}</span></div>
      <p className={s.hint}>{[record.data.evaluee.first, record.data.evaluee.middle, record.data.evaluee.last].filter(Boolean).join(' ')} · {new Date(record.created_at).toLocaleDateString(locale)}</p>
      {record.customer_message && <div className={s.notice}><strong>{w('staffMessage')}</strong><p style={{ whiteSpace: 'pre-wrap' }}>{record.customer_message}</p></div>}
      <details><summary>{t('applicationDetails')}</summary><ApplicationDetails data={record.data} /></details>
    </section>
    {error && <div className={s.errors} role="alert">{error}</div>}{notice && <p className={s.notice} role="status">{notice}</p>}
    <section className={s.panel + ' ' + s.workflowPanel}><h2>{w('documents')}</h2><p className={s.hint}>{t('documentsNote')}</p>
      <ul className={s.fileList}>{record.files.filter(f => f.kind === 'document').map(f => <li key={f.id}><a href={`/api/evaluation/${prefix}/files/${f.id}`}>{f.name}</a><span>{Math.max(1, Math.ceil(f.bytes / 1024))} KB</span></li>)}</ul>
      {!record.files.some(f => f.kind === 'document') && <p className={s.hint}>{w('noDocuments')}</p>}
      {!locked && <form onSubmit={upload} className={s.uploadForm}><label className={s.field}><span>{w('chooseFile')}</span><input name="file" type="file" required accept="application/pdf,image/png,image/jpeg" disabled={busy} /></label><p className={s.hint}>{w('fileRules')}</p><button className={s.secondary} disabled={busy}><Upload size={17} />{busy ? w('working') : w('upload')}</button></form>}
    </section>
    <section className={s.panel + ' ' + s.workflowPanel}><h2>{w('paymentHeading')}</h2><p className={s.hint}>{w('testPayment')}</p>
      {record.total === null ? <div className={s.notice}>{w('awaitQuote')}</div> : <div className={s.total}><span>{w('confirmedTotal')}</span><strong>{money(record.total)}</strong>{record.confirmed_quote && <><p className={s.hint}>{w('baseAmount')}: {money(record.confirmed_quote.base)}<br />{w('additionalAmount')}: {money(record.confirmed_quote.additional)}</p><p className={s.hint}>{record.confirmed_quote.explanation}</p></>}</div>}
      {record.status !== 'cancelled' && ['unpaid', 'pending'].includes(record.payment_status) && record.total !== null && <button className={s.primary} disabled={busy} onClick={() => run(async () => { const data = await evaluationApi<{ url: string }>(prefix + '/checkout', {}); location.assign(data.url); })}>{w('pay', { amount: money(record.total!) })}</button>}
      <button className={s.textButton} style={{ marginLeft: 16 }} disabled={busy} onClick={() => run(async () => { await evaluationApi(prefix + '/reconcile', {}); setNotice(w('refreshed')); })}><RefreshCw size={16} />{w('refreshPayment')}</button>
    </section>
    <section className={s.panel + ' ' + s.workflowPanel}><h2>{w('report')}</h2>{record.files.some(f => f.kind === 'report') ? record.files.filter(f => f.kind === 'report').map(f => <a key={f.id} className={s.secondary} href={`/api/evaluation/${prefix}/files/${f.id}`}><FileDown size={17} />{w('downloadReport')}</a>) : <p className={s.hint}>{w('reportPending')}</p>}</section>
    <div className={s.actions}><button type="button" className={s.secondary} onClick={() => window.print()}><Printer size={17} />{t('print')}</button><button className={s.secondary} disabled={busy} onClick={() => run(async () => { setNotice(w('refreshed')); })}><RefreshCw size={17} />{w('refresh')}</button></div>
    <details className={s.workflowPanel}><summary>{w('originalEstimate')}</summary><QuoteSummary value={record.quote} locale={locale} /></details>
    {!locked && ['unpaid', 'pending'].includes(record.payment_status) && <div className={s.workflowPanel}>{cancelPrompt ? <div className={s.notice}><p>{w('cancelConfirm')}</p><div className={s.actions}><button className={s.secondary} disabled={busy} onClick={() => setCancelPrompt(false)}>{w('keepApplication')}</button><button className={s.secondary} disabled={busy} onClick={() => run(async () => { await evaluationApi(prefix + '/cancel', {}); setCancelPrompt(false); })}>{w('cancel')}</button></div></div> : <button className={s.textButton} onClick={() => setCancelPrompt(true)}>{w('cancel')}</button>}</div>}
  </div>;
}
