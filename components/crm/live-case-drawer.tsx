'use client';
import {useEffect,useRef,useState,type FormEvent} from 'react';
import {ArrowRight,RotateCcw} from 'lucide-react';
import {date,label,money,type CaseReference,type WorkspaceRow} from '@/lib/crm/contracts';
import {statusAllowed} from '@/lib/crm/live-domain';
import {Badge,WorkspaceDialog,request,WorkspaceError,errorMessage} from './ui';
import {EducationHistory,SelectedServices} from './record-details';
import {CaseDetailHeader} from './case-detail-header';
import {CaseDocuments} from './documents';
import s from './crm.module.css';

export default function LiveCaseDrawer({target,initialTab='overview',onClose,onSaved}:{target:CaseReference;initialTab?:string;onClose:()=>void;onSaved:()=>void}){
 const [record,setRecord]=useState<any>(null),[tab,setTab]=useState(initialTab),[error,setError]=useState(''),[notice,setNotice]=useState(''),[busy,setBusy]=useState(false),[stale,setStale]=useState(false);
 const lock=useRef(false);const base=`/api/staff-records/${target.kind}/${encodeURIComponent(target.id)}`;
 async function load(signal?:AbortSignal){const value=await request(base,undefined,signal);setRecord(value);setStale(false);return value;}
 useEffect(()=>{const c=new AbortController();load(c.signal).catch(e=>{if(e.name!=='AbortError')setError(errorMessage(e));});return()=>c.abort();},[base]);
 async function save(body:Record<string,unknown>){if(lock.current||stale)return;lock.current=true;setBusy(true);setError('');setNotice('');try{await request(base,{...body,version:record.version});await load();onSaved();setNotice('Saved to the shared business record. The previous workspace will show it after refresh.');}catch(e){setError(e instanceof WorkspaceError&&e.status===409?'This record changed or the action is not allowed in its current state. Refresh before trying again.':errorMessage(e));if(e instanceof WorkspaceError&&e.status===409)setStale(true);if(e instanceof WorkspaceError&&[401,403,404].includes(e.status))setRecord(null);}finally{lock.current=false;setBusy(false);}}
 function form(e:FormEvent<HTMLFormElement>,action:string){e.preventDefault();const f=Object.fromEntries(new FormData(e.currentTarget));if(action==='amount')save({action,amount:f.amount===''?null:Math.round(Number(f.amount)*100)});else if(action==='office')save({action,office:f.office===''?null:f.office});else save({action,...f});}
 const r=record?.row;const summary:WorkspaceRow|undefined=record?.summary;const formal=target.kind==='formal',pre=target.kind==='preeval',payment=target.kind==='payment';
 const statusOptions=summary?['processing','completed','cancelled'].filter(v=>statusAllowed(r.status,summary.payment_status,v)):[];
 const tabs=payment?['overview','payment','activity']:['overview','education','service','documents','payment','activity'];
 return <WorkspaceDialog open onClose={onClose} title={(summary?.name||'Application')+' application details'} drawer>
  {error&&<p role="alert" className={s.formError}>{error}</p>}
  {!record?<div className={s.empty}>{error?'Record unavailable.':'Loading application…'}</div>:<>
   <CaseDetailHeader id={r.id} name={summary!.name} office={summary!.office} service={summary!.service} status={summary!.status} paymentStatus={summary!.payment_status} caption="Live business record. Saved changes are shared with the previous workspace." tabs={tabs} tab={tab} onTab={setTab}/>
   {notice&&<p role="status" className={s.helperText}>{notice}</p>}
   <fieldset className={s.liveFieldset} disabled={busy||stale}>
    {tab==='overview'&&<div className={s.detailContent}>
     <section><h3>Client information</h3><dl className={s.detailGrid}><div><dt>Email</dt><dd>{r.email||'Not recorded'}</dd></div><div><dt>Office</dt><dd>{summary!.office||'Unassigned'}</dd></div><div><dt>Created At</dt><dd>{date(r.created_at||'')}</dd></div><div><dt>Updated At</dt><dd>{date(summary!.updated_at)}</dd></div>{formal&&<><div><dt>Phone</dt><dd>{r.phone}</dd></div><div><dt>Address</dt><dd>{[r.street_address,r.street_address2,r.city,r.region,r.zip_code,r.country].filter(Boolean).join(', ')}</dd></div><div><dt>Evaluee Name</dt><dd>{summary!.name}</dd></div></>}</dl></section>
     {!payment&&<section><h3>Manage application</h3>{statusOptions.length?<form className={s.form} onSubmit={e=>form(e,'status')}><label>Review status<select name="status" key={record.version} defaultValue="" required><option value="" disabled>Choose a status</option>{statusOptions.map(v=><option key={v} value={v}>{label(v)}</option>)}</select></label><p className={s.helperText}>Processing and completion require a paid record. Saving a status does not send an email.</p><button className={s.secondaryButton}>Save status</button></form>:<p className={s.helperText}>No status transition is available for this record.</p>}</section>}
     {(formal||target.kind==='external')&&<section><h3>Assigned office</h3><form className={s.form} onSubmit={e=>form(e,'office')}><label>Office<select name="office" key={record.version} defaultValue={r.office||''}>{record.offices.map((name:string)=><option key={name}>{name}</option>)}{record.includeUnassigned&&<option value="">Unassigned</option>}</select></label><button className={s.secondaryButton}>Save office</button></form></section>}
     {!pre&&<section><h3>{formal?'Application notes':'Notes'}</h3><form className={s.form} onSubmit={e=>form(e,'notes')}><label>{formal?'Notes shared with the original application':'Record notes'}<textarea name="notes" key={record.version} defaultValue={formal?r.purpose_other||'':r.notes||''} maxLength={10000} rows={4}/></label>{formal&&<p className={s.helperText}>These are the original application notes and may be visible to the applicant.</p>}<button className={s.secondaryButton}>Save note</button></form></section>}
    </div>}
    {tab==='education'&&<div className={s.detailContent}><section><h3>Education History <span className={s.sectionCount}>{record.educations.length}</span></h3><EducationHistory educations={record.educations}/></section></div>}
    {tab==='service'&&<div className={s.detailContent}>{formal?<><h3 className={s.recordSectionTitle}>Service Details</h3><SelectedServices application={r}/></>:<section><h3>Requested service</h3><strong>{summary!.service}</strong><p>{label(summary!.purpose)}</p></section>}
     {pre&&record.educations.map((e:any)=><section key={e.id}><h3>Preliminary result · {e.school_name}</h3><form className={s.form} onSubmit={event=>form(event,'result')}><input type="hidden" name="educationId" value={e.id}/><label>Stored assessment<textarea name="result" key={record.version} defaultValue={typeof e.ai_output==='string'?e.ai_output:e.ai_output?JSON.stringify(e.ai_output):''} maxLength={20000} rows={8} required disabled={['completed','cancelled'].includes(r.status)}/></label><p className={s.helperText}>Corrections update the selected education in the original record. Completed or cancelled applications are locked. No assessment is regenerated or emailed.</p><button className={s.secondaryButton} disabled={['completed','cancelled'].includes(r.status)}>Save correction</button></form></section>)}
    </div>}
    {tab==='documents'&&<CaseDocuments key={target.kind+target.id} kind={target.kind} id={target.id}/>}
    {tab==='payment'&&<div className={s.detailContent}><div className={s.paymentSummary}><span>Recorded amount</span><strong>{summary!.amount === null ? 'Not recorded' : money(summary!.amount)}</strong><Badge>{label(summary!.payment_status)}</Badge></div>
     {formal&&r.status==='submitted'&&!['paid','refunded'].includes(r.payment_status)&&<section><h3>Update amount due</h3><form className={s.form} onSubmit={e=>form(e,'amount')}><label>Amount due (USD)<input name="amount" type="number" min="0" max="9999.99" step="0.01" key={record.version} defaultValue={r.due_amount??''}/></label><p className={s.helperText}>This updates the amount in the original application. No charge, payment link or email is created.</p><button className={s.secondaryButton}>Save amount</button></form></section>}
     <section><h3>Payment activity</h3>{pre?record.payments.map((p:any)=><div className={s.detailPayment} key={p.id}><div><strong>{label(p.payment_status)}</strong><small>{p.id} · {date(p.paid_at||'')}</small></div><strong>{money(Math.round(Number(p.due_amount)*100))}</strong></div>):<dl className={s.detailGrid}><div><dt>Payment reference</dt><dd>{r.payment_id||'Not recorded'}</dd></div><div><dt>Paid date</dt><dd>{date(r.paid_at||'')}</dd></div></dl>}{pre&&!record.payments.length&&<p>No payment record is linked to this application.</p>}<p className={s.helperText}>Provider payment statuses are displayed as recorded. Charges, refunds and new payment links remain in the previous workspace.</p></section>
    </div>}
    {tab==='activity'&&<div className={s.detailContent}><h3>Activity in this workspace</h3><div className={s.activity}>{record.audit.map((a:any,i:number)=><div key={i}><span className={s.activityDot}/><strong>{label(a.action)}</strong><small>{a.actor} · {date(a.created_at)}</small></div>)}</div>{!record.audit.length&&<p>No changes recorded here yet. Previous workspace history is not imported.</p>}</div>}
   </fieldset>
  </>}
  <div className={s.drawerFooter}><button className={s.textButton} disabled={busy} onClick={async()=>{setError('');try{await load();setNotice('Refreshed from the shared record.');}catch(e){setError(errorMessage(e));}}}><RotateCcw size={14}/>Refresh</button><button className={s.textButton} onClick={onClose}>Back to list<ArrowRight size={15}/></button></div>
 </WorkspaceDialog>;
}
