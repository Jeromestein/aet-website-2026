import assert from 'node:assert/strict';
import {randomUUID,createHash} from 'node:crypto';
import {readFile} from 'node:fs/promises';
import {staffDb} from '../../lib/staff/db';
import {liveDb} from '../../lib/crm/live-db';
import {liveSnapshot,loadLiveRecord,recordVersion,changeInTransaction} from '../../lib/crm/live-server';
import type {StaffSession} from '../../lib/staff/session';
assert.equal(process.env.CRM_DATA_SOURCE,'live');
const all:StaffSession={id:'fixture',email:'crm-fixture@example.invalid',role:'admin',staffRole:'admin',offices:['Boston','New York','Miami','San Francisco','Los Angeles'],include_unassigned:true};
const east={...all,offices:['Boston','New York'],include_unassigned:false};
const admin=staffDb();let checks=0;function ok(condition:unknown,message:string){assert.ok(condition,message);checks++;console.log('PASS '+message);}
const businessTables=['fce_applications','fce_educations','fce_external_orders','aet_core_applications','aet_core_educations','aet_core_payments'];
async function captureBaseline(){
 const users=createHash('sha256').update(JSON.stringify(await admin`select * from public.users order by id`)).digest('hex');
 const fingerprints=[];for(const name of businessTables){const [r]=await admin`select md5(coalesce(string_agg(row_to_json(t)::text,'' order by id),'')) digest from ${admin('public.'+name)} t`;fingerprints.push({name,digest:r.digest});}
 return {users,fingerprints};
}
const baseline=process.env.CRM_ACCEPTANCE_BASELINE?JSON.parse(await readFile(process.env.CRM_ACCEPTANCE_BASELINE,'utf8')):await captureBaseline();
try{
 const list=await liveSnapshot({},all);const formal=await liveSnapshot({view:'formal'},all);const pre=await liveSnapshot({view:'equivalency'},all);const pay=await liveSnapshot({view:'payments'},all);
 const [counts]=await admin`select (select count(*)::int from public.fce_applications)+(select count(*)::int from public.fce_external_orders) formal,(select count(*)::int from public.aet_core_applications) pre,(select count(*)::int from public.aet_core_payments where application_id is null) standalone`;
 ok(list.total===counts.formal+counts.pre,'Live application totals match original tables');ok(formal.total===counts.formal,'Formal list includes imported orders');ok(pre.total===counts.pre,'All preliminary applications are available without the old 100-row cap');ok(pay.total===list.total+counts.standalone,'Standalone payment records are included');
 const eastRows=await liveSnapshot({},east);ok(eastRows.rows.every(r=>east.offices.includes(r.office!)),'Office access is enforced before listing');
 await assert.rejects(liveSnapshot({office:'Miami'},east),(e:any)=>e.status===403);checks++;
 const fId=randomUUID(),eId=randomUUID(),pId=randomUUID(),peId=randomUUID(),paymentId='crm-test-'+randomUUID();const rollback=new Error('rollback-fixtures');
 try{await admin.begin(async tx=>{
  await tx`set local lock_timeout='3s'`;
  await tx`insert into public.fce_applications(id,status,name,country,street_address,city,region,zip_code,phone,email,purpose,pronouns,first_name,last_name,date_of_birth,service_type,delivery_method,payment_status,office,due_amount) values(${fId},'submitted','Fictional CRM Test','US','Test address','Boston','MA','02110','617-555-0100','crm-fixture@example.invalid','evaluation-education','mx','Fictional','Fixture','2000-01-01','{}','no_delivery_needed','paid','Boston',19.88)`;
  await tx`insert into public.fce_educations(id,application_id,country_of_study,degree_obtained,school_name,study_start_date,study_end_date) values(${eId},${fId},'US','Test degree','Test college','{"year":"2018","month":"1"}','{"year":"2022","month":"1"}')`;
  await tx`insert into public.aet_core_applications(id,first_name,last_name,email,status) values(${pId},'Fictional','Fixture','crm-fixture@example.invalid','submitted')`;
  await tx`insert into public.aet_core_educations(id,application_id,country_of_study,degree_obtained,school_name,study_start_date,study_end_date,ai_output) values(${peId},${pId},'US','Test degree','Test college','{"year":"2018","month":"1"}','{"year":"2022","month":"1"}',${tx.json('Fixture result')})`;
  await tx`insert into public.aet_core_payments(id,application_id,due_amount,payment_status) values(${paymentId},${pId},19.88,'paid')`;

  const first=await loadLiveRecord(tx,'formal',fId,all);const v=recordVersion(first);
  await changeInTransaction(tx,'formal',fId,{version:v,action:'notes',notes:'Shared fixture note'},all);
  ok((await tx`select purpose_other from public.fce_applications where id=${fId}`)[0].purpose_other==='Shared fixture note','New note is readable through the original table contract');
  await assert.rejects(changeInTransaction(tx,'formal',fId,{version:v,action:'notes',notes:'stale'},all),(e:any)=>e.status===409);checks++;
  let current=await loadLiveRecord(tx,'formal',fId,all);
  // Simulate an old-system write, then reject the newer interface's stale snapshot.
  await tx`update public.fce_applications set purpose_other='Changed by original reader' where id=${fId}`;
  await assert.rejects(changeInTransaction(tx,'formal',fId,{version:recordVersion(current),action:'notes',notes:'overwrite'},all),(e:any)=>e.status===409);checks++;
  current=await loadLiveRecord(tx,'formal',fId,all);await changeInTransaction(tx,'formal',fId,{version:recordVersion(current),action:'status',status:'processing'},all);
  ok((await tx`select status from public.fce_applications where id=${fId}`)[0].status==='processing','Status update uses the shared original row');
  current=await loadLiveRecord(tx,'formal',fId,all);await assert.rejects(changeInTransaction(tx,'formal',fId,{version:recordVersion(current),action:'office',office:'Miami'},east),(e:any)=>e.status===403);checks++;
  await assert.rejects(loadLiveRecord(tx,'formal',fId,{...all,offices:['Miami']}),(e:any)=>e.status===403);checks++;
  await tx`update public.fce_applications set status='submitted',payment_status='pending' where id=${fId}`;
  current=await loadLiveRecord(tx,'formal',fId,all);await changeInTransaction(tx,'formal',fId,{version:recordVersion(current),action:'amount',amount:23456},all);
  ok(Number((await tx`select due_amount from public.fce_applications where id=${fId}`)[0].due_amount)===234.56,'Amount updates preserve decimal dollars in the legacy table');
  current=await loadLiveRecord(tx,'formal',fId,all);await changeInTransaction(tx,'formal',fId,{version:recordVersion(current),action:'office',office:'New York'},all);
  ok((await tx`select office from public.fce_applications where id=${fId}`)[0].office==='New York','Office reassignment saves to the original row');
  const pc=await loadLiveRecord(tx,'preeval',pId,all);await changeInTransaction(tx,'preeval',pId,{version:recordVersion(pc),action:'result',educationId:peId,result:'Updated fixture result'},all);
  ok((await tx`select ai_output from public.aet_core_educations where id=${peId}`)[0].ai_output==='Updated fixture result','Assessment correction preserves the original JSON string format');
  await assert.rejects(loadLiveRecord(tx,'preeval',pId,east),(e:any)=>e.status===403);checks++;
  ok((await tx`select count(*)::int n from aet_crm.audit where record_id in (${fId},${pId})`)[0].n===5,'Changes and audit entries are transactional');
  throw rollback;
 });}catch(e){if(e!==rollback)throw e;}
 ok((await admin`select count(*)::int n from public.fce_applications where id=${fId}`)[0].n===0,'Synthetic business records rolled back');
 ok((await admin`select count(*)::int n from aet_crm.audit where record_id in (${fId},${pId})`)[0].n===0,'Synthetic audit records rolled back');
 await liveDb().begin(async runtime=>{
  for(const query of ['select 1 from public.users limit 0','select 1 from auth.users limit 0','select 1 from aet_private.staff_accounts limit 0','delete from public.fce_applications where false',"update public.fce_applications set payment_status='paid' where false",'delete from aet_crm.audit where false']){
   await assert.rejects(runtime.savepoint(async scoped=>{await scoped.unsafe(query);}), (e:any)=>e.code==='42501');checks++;
  }
  await runtime`update public.fce_applications set purpose_other=purpose_other where false`;
  await runtime`update public.aet_core_educations set ai_output=ai_output where false`;
  await runtime`select id from public.fce_applications limit 0 for update`;
  await runtime`select id from public.aet_core_educations limit 0 for update`;
  await runtime`select id from public.aet_core_payments limit 0 for share`;
  ok(true,'Restricted connection permits only the intended business update columns');
 });
 const digest=createHash('sha256').update(JSON.stringify(await admin`select * from public.users order by id`)).digest('hex');ok(digest===baseline.users,'Complete legacy employee table is unchanged');
 for(const before of baseline.fingerprints){const [after]=await admin`select md5(coalesce(string_agg(row_to_json(t)::text,'' order by id),'')) digest from ${admin('public.'+before.name)} t`;ok(after.digest===before.digest,'Original business contents unchanged: '+before.name);}
 console.log(`${checks} live CRM checks passed; all test writes rolled back.`);
}catch(e){console.error('Live acceptance failed: '+[(e as any).code,(e as Error).message].filter(Boolean).join(': '));process.exitCode=1;}finally{await admin.end();await liveDb().end();}
