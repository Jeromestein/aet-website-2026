"use client";
import {useEffect,useState} from 'react';
import {ArrowRight,RotateCcw} from 'lucide-react';
import type {IntakeReceipt} from '@/lib/application/intake';
import {date,label,money,type WorkspaceRow} from '@/lib/crm/contracts';
import {intakeDetails} from '@/lib/crm/intake-details';
import {WorkspaceDialog,Badge,request,errorMessage} from './ui';
import {CaseDetailHeader} from './case-detail-header';
import {EducationHistory,SelectedServices} from './record-details';
import {CaseDocuments} from './documents';
import s from './crm.module.css';

export default function IntakeDrawer({id,initial,initialTab='overview',onClose}:{id:string;initial?:WorkspaceRow;initialTab?:string;onClose:()=>void}){
 const [record,setRecord]=useState<IntakeReceipt|null>(null),[error,setError]=useState(''),[tab,setTab]=useState(initialTab),[busy,setBusy]=useState(false);
 async function load(signal?:AbortSignal){const value=await request<IntakeReceipt>('/api/application-intake/'+id,undefined,signal);setRecord(value);}
 useEffect(()=>{const controller=new AbortController();load(controller.signal).catch(e=>{if(e.name!=='AbortError')setError(errorMessage(e));});return()=>controller.abort();},[id]);
 const details=record?intakeDetails(record,initial):null;
 return <WorkspaceDialog open onClose={onClose} title={(details?.name||'Test')+' application details'} drawer>
  {error&&<p role="alert" className={s.formError}>{error}</p>}
  {!record||!details?<div className={s.empty}><p>{error?'Application unavailable.':'Loading application…'}</p></div>:<>
   <CaseDetailHeader id={record.id} name={details.name} office={details.office} service={details.service} status={record.status} paymentStatus={initial?.payment_status||'Not recorded'} caption="Test record. Stored separately from live applications." tabs={['overview','education','service','documents','payment','activity']} tab={tab} onTab={setTab}/>
   {tab==='overview'&&<div className={s.detailContent}>
    <section><h3>Client information</h3><dl className={s.detailGrid}>
     <div><dt>Email</dt><dd>{record.data.email||'Not recorded'}</dd></div><div><dt>Office</dt><dd>{details.office||'Unassigned'}</dd></div>
     <div><dt>Created At</dt><dd>{date(record.createdAt)}</dd></div><div><dt>Updated At</dt><dd>{date(initial?.updated_at||record.createdAt)}</dd></div>
     <div><dt>Phone</dt><dd>{record.data.phone||'Not recorded'}</dd></div><div><dt>Address</dt><dd>{details.address}</dd></div>
     <div><dt>Evaluee Name</dt><dd>{details.name}</dd></div>
    </dl></section>
    <section><h3>Manage application</h3><p className={s.helperText}>This test submission is currently read-only.</p></section>
    <section><h3>Application notes</h3><dl className={s.detailGrid}><div><dt>Applicant notes</dt><dd>{record.data.notes||'Not provided'}</dd></div></dl></section>
   </div>}
   {tab==='education'&&<div className={s.detailContent}><section><h3>Education History <span className={s.sectionCount}>{details.educations.length}</span></h3><EducationHistory educations={details.educations}/></section></div>}
   {tab==='service'&&<div className={s.detailContent}><h3 className={s.recordSectionTitle}>Service Details</h3><SelectedServices application={details.services}/>{details.educationLinks.length>0&&<section><h3>Selected qualifications</h3><dl className={s.detailGrid}>{details.educationLinks.map(link=><div key={link.service}><dt>{link.service}</dt><dd>{link.degrees.join('; ')}</dd></div>)}</dl></section>}</div>}
   {tab==='documents'&&<CaseDocuments key={record.id} kind="formal" id={record.id} source="preview"/>}
   {tab==='payment'&&<div className={s.detailContent}><div className={s.paymentSummary}><span>Recorded amount</span><strong>{initial?.amount==null?'Not recorded':money(initial.amount)}</strong><Badge>{label(initial?.payment_status||'Not recorded')}</Badge></div><section><h3>Payment activity</h3><p className={s.helperText}>Payment processing is not enabled for this test submission.</p></section></div>}
   {tab==='activity'&&<div className={s.detailContent}><h3>Application activity</h3><div className={s.activity}><div><span className={s.activityDot}/><strong>Application submitted</strong><small>{date(record.createdAt)}</small></div></div><section><h3>Email delivery</h3><dl className={s.detailGrid}><div><dt>Confirmation email</dt><dd>{label(record.email.state)}</dd></div><div><dt>Recipient</dt><dd>{record.email.recipient}</dd></div></dl></section></div>}
  </>}
  <div className={s.drawerFooter}><button className={s.textButton} disabled={busy} onClick={async()=>{setBusy(true);setError('');try{await load();}catch(e){setError(errorMessage(e));}finally{setBusy(false);}}}><RotateCcw size={14}/>Refresh</button><button className={s.textButton} onClick={onClose}>Back to list<ArrowRight size={15}/></button></div>
 </WorkspaceDialog>;
}
