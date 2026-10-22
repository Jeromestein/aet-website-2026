"use client";
import { useTranslations } from 'next-intl';
import { useEffect, useRef, useState, type FormEvent } from 'react';
import { Search, CircleCheck, Clock3 } from 'lucide-react';
import type { Locale } from '@/i18n/routing';
import { paymentWindow } from '@/lib/customer-status/payment-window';
import { statusCopy } from '@/lib/customer-status/copy';
import { statusLookup, type CustomerStatus } from '@/lib/customer-status/model';
import s from './status.module.css';
import { intakeCopy } from '@/lib/application/intake-copy';
import { StatusSections } from './sections';
export function StatusPage({locale, initialId,preview=false}: {locale: Locale; initialId: string;preview?:boolean}) {
 const documents = useTranslations('documents');
 const t = statusCopy[locale]; const [id,setId] = useState(initialId); const [record,setRecord] = useState<CustomerStatus|null>(null);
 const [uploading,setUploading] = useState(false);
 const [busy,setBusy] = useState(false); const [error,setError] = useState(''); const [now,setNow] = useState(0);
 const active = useRef<AbortController|null>(null); const prefix = locale === 'en' ? '' : '/' + locale;
 async function check(value: string, updateUrl = false) {
  active.current?.abort(); setUploading(false); setRecord(null); setError('');
  const parsed = statusLookup.safeParse({applicationId:value});
  if(!parsed.success) {setBusy(false);setError(t.invalid);return;}
  const controller = new AbortController(); active.current = controller; setBusy(true);
  if(updateUrl) {const url = new URL(location.href);url.searchParams.set('applicationId',parsed.data.applicationId);history.replaceState(null,'',url);}
  try {
   const response = await fetch('/api/customer-status'+(preview?'?source=preview':''),{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(parsed.data),cache:'no-store',signal:controller.signal});
   const data = await response.json();
   if(!response.ok) throw new Error(data.error);
   if(!controller.signal.aborted) {setRecord(data);setNow(Date.now());}
  } catch(e) {if(!controller.signal.aborted) {const code=(e as Error).message;setError(code==='not_found'?t.missing:code==='too_many_requests'?t.limited:t.failed);}}
  finally {if(!controller.signal.aborted) setBusy(false);}
 }
 useEffect(()=>{setId(initialId); if(initialId) void check(initialId); return ()=>active.current?.abort();},[initialId,locale,preview]);
 useEffect(()=>{if(!record?.deadline || record.payment !== 'pending')return;const end=Date.parse(record.deadline);if(end<=Date.now())return;const timer=setInterval(()=>{const time=Date.now();setNow(time);if(time>=end)clearInterval(timer);},1000);return ()=>clearInterval(timer);},[record?.deadline,record?.payment]);
 const date=(value:string)=>{const d=new Date(value);return value&&Number.isFinite(d.getTime())?new Intl.DateTimeFormat(locale==='zh'?'zh-CN':locale,{dateStyle:'medium',timeStyle:'short'}).format(d):t.unknown;};
 const remaining=record?.deadline?Math.max(0,Math.floor((new Date(record.deadline).getTime()-now)/1000)):0;
 const windowState=record?paymentWindow(record,now):'none';
 const timer=[Math.floor(remaining/3600),Math.floor(remaining/60)%60,remaining%60].map(n=>String(n).padStart(2,'0')).join(' : ');
 const label=(map:Record<string,string>,key:string)=>map[key]||t.unknown;
 function submit(e:FormEvent){e.preventDefault();void check(id,true);}
 return <main className={s.main} id="main-content">
  <header className={s.intro}><p className={s.eyebrow}>{t.eyebrow}</p><h1>{t.title}</h1><p>{t.intro}</p></header>
  <div className={s.layout}>
   <aside className={s.aside}><h2>{t.next}</h2><ol>{t.steps.map((step,i)=><li key={step}><span>{i+1}</span><div><h3>{step}</h3><p>{t.descriptions[i]}</p></div></li>)}</ol>
    {windowState!=='none'&&<div className={s.warning}><strong><Clock3 size={18}/>{windowState==='expired'?t.payments.expired:t.paymentRequired}</strong><p>{windowState==='pending'?t.remaining:t.expired}</p>{windowState==='pending'&&<div className={s.timer} aria-label={t.remaining}>{timer}</div>}</div>}
    <p className={s.help}>{t.help}</p>
   </aside>
   <div className={s.content}>
    {!record&&<form className={s.card} onSubmit={submit} aria-busy={busy}><label htmlFor="applicationId">{t.id}</label><div className={s.lookup}><input id="applicationId" name="applicationId" value={id} onChange={e=>{active.current?.abort();setBusy(false);setId(e.target.value);setRecord(null);setError('');}} autoComplete="off" autoCapitalize="none" spellCheck={false} placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx" maxLength={64} aria-invalid={!!error} aria-describedby={error?'status-error':undefined}/><button disabled={busy}><Search size={18}/>{busy?t.loading:t.check}</button></div>{error&&<p id="status-error" role="alert" className={s.error}>{error}</p>}{busy&&<p role="status">{t.loading}</p>}</form>}
    {record&&<>
     <section className={s.card} aria-live="polite">{record.source==='preview'&&<p className={s.sectionNotice}>{intakeCopy[locale].test}</p>}<div className={s.sectionHeading}><CircleCheck size={25}/><h2>{t.heading}</h2><span className={s.badge} data-status={record.status}>{label(t.status,record.status)}</span></div>
      <dl className={s.facts}><div><dt>{t.payment}</dt><dd className={record.payment==='paid'?s.paid:s.pending}>{label(t.payments,record.payment)}</dd></div><div><dt>{t.submitted}</dt><dd>{date(record.submitted)}</dd></div><div><dt>{t.office}</dt><dd>{record.office||t.unknown}</dd></div><div><dt>{t.paid}</dt><dd>{record.paid?date(record.paid):t.notPaid}</dd></div><div><dt>{t.service}</dt><dd>{record.services}</dd></div>{record.amount!==null&&record.payment!=='paid'&&<div><dt>{t.amount}</dt><dd>{new Intl.NumberFormat(locale,{style:'currency',currency:'USD'}).format(record.amount/100)}</dd></div>}</dl>
      {record.completion&&<div className={s.estimate}><strong>{t.due}: {record.completion.dueDate}</strong><p>{t.estimate}</p></div>}
     </section>
     <StatusSections key={record.source+record.id} record={record} locale={locale} onBusyChange={setUploading}/>
     <div className={s.statusActions}>
      <button type="button" disabled={uploading||busy} onClick={()=>void check(record.id)}>{documents('refresh')}</button>
      <button type="button" disabled={uploading} onClick={()=>{setRecord(null);setError('');}}>{documents('otherApplication')}</button>
     </div>
    </>}
    <p className={s.preliminary}>{t.preliminary} <a href={prefix+'/status-check'}>{t.preliminaryLink}</a></p>
   </div>
  </div>
 </main>;
}
