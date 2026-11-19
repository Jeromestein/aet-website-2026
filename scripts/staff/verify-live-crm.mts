import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFile} from 'node:fs/promises';
import {staffDb} from '../../lib/staff/db';
import {liveDb} from '../../lib/crm/live-db';
import {liveSnapshot,liveDetail} from '../../lib/crm/live-server';
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
 for(const row of list.rows.slice(0,3)){
   const detail=await liveDetail(row.kind,row.id,all);
   ok(detail.summary.id===row.id,'Scoped detail matches the selected row');
 }
 ok(JSON.stringify(await captureBaseline())===JSON.stringify(baseline),'Historical data is unchanged');
 console.log(checks+' read-only checks passed');
}finally{await admin.end();await liveDb().end();}
