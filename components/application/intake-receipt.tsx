"use client";
import { useTranslations } from 'next-intl';
import { formatTurnaround } from '@/lib/pricing-format';
import { useState } from 'react';
import { FileCheck2, Mail } from 'lucide-react';
import type { Locale } from '@/i18n/routing';
import type { IntakeReceipt } from '@/lib/application/intake';
import { intakeCopy } from '@/lib/application/intake-copy';
import { applicationCopy } from '@/lib/application/copy';
import { evaluationCopy } from '@/lib/application/evaluation-copy';
import { deliveryCopy } from '@/lib/application/delivery-copy';
import { evaluationReports,shipping } from '@/lib/pricing';
import s from './application.module.css';
export function IntakeSummary({record,locale}:{record:IntakeReceipt;locale:Locale}){
 const p=useTranslations('pricing');
 const c=applicationCopy[locale],ec=evaluationCopy[locale],dc=deliveryCopy[locale],t=intakeCopy[locale],data=record.data;
 const [email,setEmail]=useState(record.email),[busy,setBusy]=useState(false),[error,setError]=useState('');
 const money=(cents:number)=>new Intl.NumberFormat(locale,{style:'currency',currency:'USD'}).format(cents/100);
 const range=(min:number,max:number)=><><span className={s.currency}>{money(min)}</span>{min!==max&&<> – <span className={s.currency}>{money(max)}</span></>}</>;
 const row=(label:string,value:string)=><div><dt>{label}</dt><dd>{value||'—'}</dd></div>;
 const names:Record<string,string>={document:locale==='zh'?'逐份文件评估':locale==='es'?'Evaluación documento por documento':'Document by Document Evaluation',course:locale==='zh'?'逐门课程评估':locale==='es'?'Evaluación curso por curso':'Course by Course Evaluation'};
 const lineName=(id:string)=>names[id]||((id==='documentAdditional'||id==='courseAdditional')?ec.additionalFees:p('services.'+([...evaluationReports,...shipping].find(rate=>rate.id===id)?.label||id)));
 async function retry(){setBusy(true);setError('');try{const response=await fetch('/api/application-intake/'+record.id,{method:'POST'});if(!response.ok)throw new Error();setEmail((await response.json()).email);}catch{setError(t.retryError);}finally{setBusy(false);}}
 return <section className={s.receipt}>
  <p className={s.eyebrow}>{t.test}</p><h2><FileCheck2 size={24}/> {t.saved}</h2><p>{t.next}</p>
  <dl className={s.reviewGrid}>{row(t.id,record.id)}{row(t.status,t.submitted)}{row(t.created,new Date(record.createdAt).toLocaleString(locale))}</dl>
  <section className={s.reviewSection}><h3>{c.contactHeading}</h3><dl className={s.reviewGrid}>{row(c.contactName,data.contactName)}{row(c.email,data.email)}{row(c.phone,data.phone)}{row(c.personHeading,[data.pronouns,data.firstName,data.middleName,data.lastName].filter(Boolean).join(' '))}{row(c.dateOfBirth,data.dateOfBirth)}{row(c.purpose,({uscis:c.purposeUscis,education:c.purposeEducation,employment:c.purposeEmployment,other:c.purposeOther} as Record<string,string>)[data.purpose])}</dl></section>
  <section className={s.reviewSection}><h3>{c.educationHeading}</h3>{data.educations.map((e,index)=><div className={s.reviewEducation} key={index}><div><strong>{index+1}. {e.degree}</strong><p>{e.school} · {e.country}</p><small>{e.start} — {e.end}</small></div></div>)}</section>
  <section className={s.reviewSection}><h3>{ec.reviewTitle}</h3>{(['document','course'] as const).filter(id=>data.evaluationRequest.services[id].selected).map(id=>{const choice=data.evaluationRequest.services[id];return <div key={id}><strong>{names[id]}</strong><p>{formatTurnaround(record.quote.lines.find(line=>line.id===id)?.turnaround || {kind:'notApplicable'}, p)}</p><p>{ec.linkedEducation}: {choice.educationIndexes.map(i=>data.educations[i].degree).join(', ')}</p></div>;})}
  <dl className={s.receiptFees}>{record.quote.lines.map((line,i)=><div key={i}><dt>{lineName(line.id)}{line.quantity>1?' × '+line.quantity:''}</dt><dd>{range(line.min,line.max)}</dd></div>)}<div><dt><strong>{t.total}</strong></dt><dd><strong>{range(record.quote.min,record.quote.max)}</strong></dd></div></dl><p>{ec.feeScope}</p>{data.evaluationRequest.translation&&<p>{ec.translation} · {ec.awaitingQuote}</p>}{record.quote.needsQuote&&<p>{t.pending}</p>}</section>
  <section className={s.reviewSection}><h3>{dc.title}</h3><p>{p('services.'+evaluationReports.find(r=>r.id===data.evaluationDelivery.report)!.label)}</p>{data.evaluationDelivery.report==='paper'&&<><p>{[data.evaluationDelivery.address.name,data.evaluationDelivery.address.street,data.evaluationDelivery.address.street2,data.evaluationDelivery.address.city,data.evaluationDelivery.address.region,data.evaluationDelivery.address.postal,data.evaluationDelivery.address.country].filter(Boolean).join(', ')}</p><p>{p('services.'+shipping.find(r=>r.id===data.evaluationDelivery.shipping)!.label)}</p><p>{dc.extraCopies}: {data.evaluationDelivery.extraCopies}</p></>}</section>
  {data.notes&&<section className={s.reviewSection}><h3>{c.notes}</h3><p>{data.notes}</p></section>}
  <section className={s.reviewSection}><h3><Mail size={18}/> {t.email}</h3><p role="status">{({queued:t.queued,sending:t.sendingEmail,sent:t.sent,failed:t.failedEmail})[email.state]}</p><p>{email.recipient}</p>{email.state!=='sent'&&<><button type="button" className={s.secondary} disabled={busy} onClick={retry}>{busy?t.sendingEmail:t.retry}</button><p className={s.hint}>{t.retryNote}</p></>}{error&&<p role="alert">{error}</p>}</section>
 </section>;
}
