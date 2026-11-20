"use client";
import {useState} from 'react';
import {useTranslations} from 'next-intl';
import {Mail} from 'lucide-react';
import type {Locale} from '@/i18n/routing';
import type {CustomerStatus} from '@/lib/customer-status/model';
import {intakeCopy} from '@/lib/application/intake-copy';
import {evaluationCopy} from '@/lib/application/evaluation-copy';
import {deliveryCopy} from '@/lib/application/delivery-copy';
import {evaluationReports,shipping} from '@/lib/pricing';
import {formatTurnaround} from '@/lib/pricing-format';
import s from './status.module.css';

// Optional saved details enrich the shared status cards for any data source.
export function SavedServiceDetails({record,locale}:{record:CustomerStatus;locale:Locale}) {
 const p=useTranslations('pricing'),ec=evaluationCopy[locale],dc=deliveryCopy[locale],t=intakeCopy[locale];
 const fees=useTranslations('evaluationWorkflow');
 const details=record.details;
 if(!details)return null;
 const {request,delivery,quote}=details;
 const confirmed=record.workflow?.confirmedQuote;
 const exactEstimate=quote.min===quote.max && !quote.needsQuote;
 const adjustment=confirmed?.kind==='adjusted' && exactEstimate ? confirmed.total-quote.min : null;
 const money=(value:number,signed=false)=>new Intl.NumberFormat(locale,{style:'currency',currency:'USD',signDisplay:signed?'exceptZero':'auto'}).format(value/100);
 const range=(min:number,max:number)=><><span className={s.currency}>{money(min)}</span>{min!==max&&<> – <span className={s.currency}>{money(max)}</span></>}</>;
 const names:Record<string,string>={document:locale==='zh'?'逐份文件评估':locale==='es'?'Evaluación documento por documento':'Document by Document Evaluation',course:locale==='zh'?'逐门课程评估':locale==='es'?'Evaluación curso por curso':'Course by Course Evaluation'};
 const lineName=(id:string)=>names[id]||((id==='documentAdditional'||id==='courseAdditional')?ec.additionalFees:p('services.'+([...evaluationReports,...shipping].find(rate=>rate.id===id)?.label||id)));
 return <div className={s.savedDetails}>
  {(['document','course'] as const).filter(id=>request.services[id].selected).map(id=><div key={id} className={s.savedService}><h3>{names[id]}</h3><p>{formatTurnaround(quote.lines.find(line=>line.id===id)?.turnaround||{kind:'notApplicable'},p)}</p><p>{ec.linkedEducation}: {request.services[id].educationIndexes.map(i=>record.educations[i]?.degree).filter(Boolean).join(', ')}</p></div>)}
  <dl className={s.feeLines}>
   {quote.lines.map(line=><div key={line.id}><dt>{lineName(line.id)}{line.quantity>1?' × '+line.quantity:''}</dt><dd>{range(line.min,line.max)}</dd></div>)}
   {confirmed?.kind==='adjusted' && !exactEstimate && <div><dt>{t.total}</dt><dd>{range(quote.min,quote.max)}</dd></div>}
   {adjustment!==null && adjustment!==0 && <div><dt>{fees('officeAdjustment')}</dt><dd>{money(adjustment,true)}</dd></div>}
   {confirmed && confirmed.kind!=='adjusted' && <>
    {quote.min!==quote.max && <div><dt>{fees('baseAmount')}</dt><dd>{money(confirmed.base)}</dd></div>}
    {confirmed.additional>0 && <div><dt>{fees('additionalAmount')}</dt><dd>{money(confirmed.additional)}</dd></div>}
   </>}
   <div className={s.feeTotal}>
    <dt>{confirmed ? fees(confirmed.kind==='adjusted'?'adjustedTotal':'confirmedTotal') : t.total}</dt>
    <dd>{confirmed ? money(confirmed.total) : range(quote.min,quote.max)}</dd>
   </div>
  </dl>
  {confirmed?.explanation && <p className={s.feeExplanation}>{confirmed.explanation}</p>}
  <p>{ec.feeScope}</p>{request.translation&&<p>{ec.translation}{!confirmed&&<> · {ec.awaitingQuote}</>}</p>}{quote.needsQuote&&!confirmed&&<p>{t.pending}</p>}
  <h3 className={s.deliveryHeading}>{dc.title}</h3><p>{p('services.'+evaluationReports.find(rate=>rate.id===delivery.report)!.label)}</p>
  {delivery.report==='paper'&&<><p>{[delivery.address.name,delivery.address.street,delivery.address.street2,delivery.address.city,delivery.address.region,delivery.address.postal,delivery.address.country].filter(Boolean).join(', ')}</p><p>{p('services.'+shipping.find(rate=>rate.id===delivery.shipping)!.label)}</p><p>{dc.extraCopies}: {delivery.extraCopies}</p></>}
 </div>;
}

export function ConfirmationEmail({id,email:initialEmail,locale}:{id:string;email:NonNullable<CustomerStatus['email']>;locale:Locale}) {
 const t=intakeCopy[locale];
 const [email,setEmail]=useState(initialEmail),[busy,setBusy]=useState(false),[error,setError]=useState('');
 async function retry(){setBusy(true);setError('');try{const response=await fetch('/api/application-intake/'+id,{method:'POST'});if(!response.ok)throw new Error();setEmail((await response.json()).email);}catch{setError(t.retryError);}finally{setBusy(false);}}
 return <section className={s.card} aria-labelledby="email-heading"><div className={s.sectionHeading}><Mail size={24}/><h2 id="email-heading">{t.email}</h2></div><p role="status">{({queued:t.queued,sending:t.sendingEmail,sent:t.sent,failed:t.failedEmail})[email.state]}</p><p>{email.recipient}</p>{email.state!=='sent'&&<><button type="button" className={s.portal} disabled={busy} onClick={retry}>{busy?t.sendingEmail:t.retry}</button><p>{t.retryNote}</p></>}{error&&<p role="alert" className={s.error}>{error}</p>}</section>;
}
