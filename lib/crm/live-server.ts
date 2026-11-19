import 'server-only';
import {completionFor} from './completion';
import type postgres from 'postgres';
import {createHash} from 'node:crypto';
import {liveDb} from './live-db';
import {cents,services,timestamp,preferredPayment,liveReference,type LiveKind} from './live-domain';
import {workspaceQuery} from './workspace-server';
import {canAccessOffice,type StaffSession} from '../staff/session';
import {AppError} from '../preeval/domain';
import {WORKSPACE_PAGE_SIZE,evalueeName,type WorkspaceSnapshot,type WorkspaceRow} from './contracts';
type Row=Record<string,any>;
const tables={formal:'public.fce_applications',preeval:'public.aet_core_applications',external:'public.fce_external_orders',payment:'public.aet_core_payments'};
type Tx=postgres.TransactionSql<{}>;
export const recordVersion=(r:Row)=>createHash('sha256').update(JSON.stringify(r)).digest('hex');
function scoped(staff:StaffSession,office:string|null){if(!canAccessOffice(staff,office))throw new AppError('access_denied',403);}
export function liveRow(kind:LiveKind,r:Row,educations:Row[]=[],payments:Row[]=[]):WorkspaceRow {
 const p=kind==='preeval'?preferredPayment(payments):r;
 const payment=p?.payment_status||'unknown';
 return {mailDelivery:kind==='formal'&&Boolean(r.delivery_method&&r.delivery_method!=='no_delivery_needed'),completion:completionFor(kind,r),kind,id:r.id,name:kind==='payment'?(r.source||'Standalone payment'):evalueeName({pronouns:r.pronouns,first:r.first_name,middle:r.middle_name,last:r.last_name}),email:r.email||'',office:r.office||null,
 service:kind==='formal'?services(r.service_type):kind==='preeval'?'Pre-Evaluation':kind==='external'?'Imported order':'Standalone payment',purpose:r.purpose||'',country:r.country||'',status:kind==='payment'?'payment_record':r.status,payment_status:payment,amount:cents(p?.due_amount),created_at:timestamp(r.created_at||r.paid_at),updated_at:timestamp(r.updated_at||r.paid_at),
 educations:educations.map(e=>({degree:e.degree_obtained,school:e.school_name,country:e.country_of_study,start:[e.study_start_date?.year,e.study_start_date?.month].filter(Boolean).join('-'),end:[e.study_end_date?.year,e.study_end_date?.month].filter(Boolean).join('-')})),
 files:[],payments:payments.map(p=>({id:p.id,session_id:p.payment_id,amount_cents:cents(p.due_amount)!,status:p.payment_status,created_at:timestamp(p.paid_at)})),attention:kind!=='payment'&&r.status!=='completed'&&r.status!=='cancelled'&&(r.status==='submitted'||payment!=='paid')};
}
export async function liveSnapshot(raw:Record<string,string>,staff:StaffSession):Promise<WorkspaceSnapshot>{
 const query=workspaceQuery.parse(raw);if(query.office!=='all')scoped(staff,query.office==='unassigned'?null:query.office);
 return liveDb().begin('isolation level repeatable read read only',async tx=>{
 const formal=await tx`select a.*,coalesce((select jsonb_agg(e order by e.id) from public.fce_educations e where e.application_id=a.id),'[]') educations from public.fce_applications a where (office=any(${staff.offices}) or office is null and ${staff.include_unassigned})`;
 const external=await tx`select * from public.fce_external_orders where (office=any(${staff.offices}) or office is null and ${staff.include_unassigned})`;
 // The legacy core tables have no office column: access requires the explicit Unassigned grant.
 const preliminary=staff.include_unassigned?await tx`select a.*,coalesce((select jsonb_agg(e order by e.id) from public.aet_core_educations e where e.application_id=a.id),'[]') educations,coalesce((select jsonb_agg(p order by p.id) from public.aet_core_payments p where p.application_id=a.id),'[]') payments from public.aet_core_applications a`:[];
 const standalone=staff.include_unassigned&&query.view==='payments'?await tx`select * from public.aet_core_payments where application_id is null`:[];
 let rows=[...formal.map(r=>liveRow('formal',r,r.educations)),...external.map(r=>liveRow('external',r)),...preliminary.map(r=>liveRow('preeval',r,r.educations,r.payments))];
 if(query.office!=='all')rows=rows.filter(r=>r.office===(query.office==='unassigned'?null:query.office));
 const count=(items:WorkspaceRow[])=>({total:items.length,attention:items.filter(r=>r.attention).length,processing:items.filter(r=>r.status==='processing').length,completed:items.filter(r=>r.status==='completed').length});
 const unpaid=rows.filter(r=>['unpaid','pending','expired','failed'].includes(r.payment_status)&&r.status!=='cancelled');
 const stats={...count(rows),unpaid:unpaid.length,outstanding:unpaid.reduce((sum,r)=>sum+(r.amount||0),0),unquoted:rows.filter(r=>r.amount===null).length,documents:0};
 if(query.view==='formal')rows=rows.filter(r=>r.kind==='formal'||r.kind==='external');
 if(query.view==='equivalency')rows=rows.filter(r=>r.kind==='preeval');
 if(query.view==='documents')rows=[];
 if(query.view==='payments'&&(query.office==='all'||query.office==='unassigned'))rows.push(...standalone.map(r=>liveRow('payment',r)));
 const counts=count(rows);
 const q=query.q.toLowerCase();rows=rows.filter(r=>(query.filter==='all'||query.filter==='attention'&&r.attention||query.filter==='processing'&&r.status==='processing'||query.filter==='completed'&&r.status==='completed')&&[r.name,r.email,r.id,r.office,r.service,JSON.stringify(r.educations)].join(' ').toLowerCase().includes(q));
 rows.sort((a,b)=>(query.sort==='name'?a.name.localeCompare(b.name):query.sort==='oldest'?a.created_at.localeCompare(b.created_at):b.created_at.localeCompare(a.created_at))||a.kind.localeCompare(b.kind)||a.id.localeCompare(b.id));
 const total=rows.length,pageSize=query.export?5000:WORKSPACE_PAGE_SIZE,page=Math.min(query.page,Math.max(1,Math.ceil(total/pageSize)));
 if(query.export&&total>pageSize)throw new AppError('export_too_large',413);
 return {rows:rows.slice((page-1)*pageSize,page*pageSize),total,page,pageSize,counts,stats,staff:{email:staff.email,offices:staff.offices,includeUnassigned:staff.include_unassigned},cloudPreview:false,liveData:true};
 });
}
export async function loadLiveRecord(tx:Tx,kind:LiveKind,id:string,staff:StaffSession){
 liveReference.parse({kind,id});
 const [row]=await tx`select * from ${tx(tables[kind])} where id::text=${id}`;
 if(!row)throw new AppError('not_found',404);scoped(staff,row.office||null);
 const educations=(kind==='formal'||kind==='preeval')?await tx`select * from ${tx(kind==='formal'?'public.fce_educations':'public.aet_core_educations')} where application_id::text=${id} order by id`:[];
 const payments=kind==='preeval'?await tx`select * from public.aet_core_payments where application_id::text=${id} order by id`:[];
 return {row,educations,payments};
}
export async function liveDetail(kind:LiveKind,id:string,staff:StaffSession){return liveDb().begin('isolation level repeatable read read only',async tx=>{
 const record=await loadLiveRecord(tx,kind,id,staff);const audit=await tx`select actor,action,created_at from aet_crm.audit where kind=${kind} and record_id=${id} order by created_at desc limit 50`;
 return {...record,summary:liveRow(kind,record.row,record.educations,record.payments),version:recordVersion(record),audit,offices:staff.offices,includeUnassigned:staff.include_unassigned};
});}
