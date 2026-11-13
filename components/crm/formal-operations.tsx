'use client';
import {useState,type FormEvent} from 'react';
import {FileText} from 'lucide-react';
import type {ApplicationRecord} from '@/lib/evaluation-application/workflow';
import {date,label,money} from '@/lib/crm/contracts';
import {Badge,errorMessage,request} from './ui';
import s from './crm.module.css';

export type FormalRecord=ApplicationRecord & {notification_state?:Record<string,{id:string;kind:string;state:string;recipient:string;attempts:number}>};
export function FormalOperations({record,tab,onSaved}:{record:FormalRecord;tab:string;onSaved:()=>Promise<void>}) {
 const [busy,setBusy]=useState(false),[error,setError]=useState(''),[notice,setNotice]=useState('');
 const base=`/api/evaluation/applications/${record.id}`;
 async function run(endpoint:string,body:Record<string,unknown>|FormData,message:string){
  setBusy(true);setError('');setNotice('');
  try{await request(base+'/'+endpoint,body);await onSaved();setNotice(message);}catch(e){setError(errorMessage(e));}finally{setBusy(false);}
 }
 function form(event:FormEvent<HTMLFormElement>,action:string){
  event.preventDefault();const data=new FormData(event.currentTarget);
  const body:Record<string,unknown>={action,version:record.version};
  if(action==='status'){body.status=data.get('status');body.message=data.get('message')||'';}
  if(action==='notes')body.notes=data.get('notes');
  if(action==='quote'){body.base=Math.round(Number(data.get('base'))*100);body.additional=Math.round(Number(data.get('additional'))*100);body.explanation=data.get('explanation');}
  void run('staff',body,'Application saved.');
 }
 const locked=['completed','cancelled'].includes(record.status);
 return <div className={s.detailContent}>
  {error&&<p role="alert" className={s.formError}>{error}</p>}{notice&&<p role="status">{notice}</p>}
  <fieldset className={s.liveFieldset} disabled={busy}>
   {tab==='overview'&&<>
    <section><h3>Manage application</h3><form className={s.form} key={'status'+record.version} onSubmit={e=>form(e,'status')}>
     <label>Application status<select name="status" defaultValue={['reviewing','needs_information','processing'].includes(record.status)?record.status:'reviewing'} disabled={record.status==='cancelled'}><option value="reviewing">Under review</option><option value="needs_information">Information required</option><option value="processing">Processing</option></select></label>
     <label>Message to applicant<textarea name="message" maxLength={2000} rows={4} defaultValue={record.customer_message}/></label>
     <p className={s.helperText}>Information requests appear on the customer’s Status page and send a test email. Processing requires payment and supporting documents. Reopening a completed application withholds its report.</p>
     <button className={s.secondaryButton} disabled={record.status==='cancelled'}>Save status</button>
    </form></section>
    <section><h3>Internal notes</h3><form className={s.form} key={'notes'+record.version} onSubmit={e=>form(e,'notes')}><label>Staff notes<textarea name="notes" maxLength={10000} rows={3} defaultValue={record.staff_notes}/></label><button className={s.secondaryButton} disabled={record.status==='cancelled'}>Save internal notes</button></form></section>
   </>}
   {tab==='documents'&&<section><h3>Final report</h3><form className={s.form} onSubmit={e=>{e.preventDefault();void run('reports',new FormData(e.currentTarget),'Report draft uploaded.');}}>
    <label>Final report PDF<input type="file" name="file" accept="application/pdf" required disabled={locked}/></label><button className={s.secondaryButton} disabled={locked}>Upload report draft</button>
   </form><p className={s.helperText}>Drafts are private. Release requires confirmed payment, supporting documents and a report matching the current materials.</p>
   {record.files.filter(f=>f.kind==='report').map(f=><div className={s.detailDocument} key={f.id}><FileText size={22}/><div><strong>{f.name}</strong><Badge tone={record.released_file_id===f.id?'green':'neutral'}>{record.released_file_id===f.id?'Released':f.input_version!==record.input_version?'Outdated draft':'Draft'}</Badge><a href={base+'/files/'+f.id}>Download PDF</a></div>{record.released_file_id!==f.id&&<button className={s.smallButton} disabled={record.status!=='processing'||record.payment_status!=='paid'||f.input_version!==record.input_version} onClick={()=>void run('staff',{action:'release',fileId:f.id,version:record.version},'Report published. Customer notification queued.')}>Release report</button>}</div>)}
   </section>}
   {tab==='payment'&&<>
    <div className={s.paymentSummary}><span>Current total</span><strong>{record.total===null?'Awaiting quote':money(record.total)}</strong><Badge tone={record.payment_status==='paid'?'green':'amber'}>{label(record.payment_status)}</Badge></div>
    {record.confirmed_quote&&<p>{record.confirmed_quote.explanation}</p>}
    {record.quote.needsQuote&&record.payment_status==='unpaid'&&!locked&&<section><h3>Confirm quote</h3><p className={s.helperText}>Original estimate: {money(record.quote.min)} – {money(record.quote.max)}. Include any separately quoted translation fee below.</p><form className={s.form} key={'quote'+record.version} onSubmit={e=>form(e,'quote')}>
     <label>Website-priced services (USD)<input name="base" type="number" min={record.quote.min/100} max={record.quote.max/100} step="0.01" defaultValue={(record.confirmed_quote?.base??record.quote.min)/100} required/></label>
     <label>Additional translation services (USD)<input name="additional" type="number" min={record.data.services.translation?0.01:0} max={record.data.services.translation?9999.99:0} step="0.01" defaultValue={(record.confirmed_quote?.additional??0)/100} required/></label>
     <label>Explanation<textarea name="explanation" minLength={3} maxLength={2000} defaultValue={record.confirmed_quote?.explanation||''} required/></label><button className={s.secondaryButton}>Confirm quote</button>
    </form></section>}
    <section><h3>Payment activity</h3>{record.payments?.length?record.payments.map(p=><div className={s.detailPayment} key={p.id}><div><strong>{label(p.status)}</strong><small>{date(p.created_at)}</small></div><strong>{money(p.amount_cents)}</strong></div>):<p>No payment attempts recorded.</p>}<button className={s.secondaryButton} onClick={()=>void run('reconcile',{},'Stripe payment status checked.')}>Verify payment</button><p className={s.helperText}>Stripe test mode. Verification checks existing payments without creating a charge.</p></section>
   </>}
   {tab==='activity'&&<section><h3>Email delivery</h3>{Object.values(record.notification_state||{}).map(n=><div className={s.detailPayment} key={n.id}><div><strong>{label(n.kind)}</strong><small>{n.recipient}</small></div><span>{label(n.state)} · {n.attempts||0} attempts</span></div>)}<p className={s.helperText}>Current notification receipts are retained for each event type. Preview messages use the controlled test recipient.</p></section>}
  </fieldset>
 </div>;
}
