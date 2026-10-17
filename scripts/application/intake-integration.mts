import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import {db,table} from '../../lib/preeval/db';
import {configuration} from '../../lib/preeval/config';
import {initialDraft} from '../../lib/application/model';
import {selectEvaluationService} from '../../lib/application/evaluation';
import {saveIntake,readIntake} from '../../lib/application/intake-server';
import {sendIntakeEmail} from '../../lib/application/intake-email';
import {workspaceSnapshot} from '../../lib/crm/workspace-server';
import {TEST_RECIPIENT} from '../../lib/application/intake';
// Reproducible database/HTTP checks. The injected transport never sends real email.
assert.equal(configuration().cloudPreview,true);
const sql=db(),origin=configuration().origin;
const data={...initialDraft('evaluation'),contactName:'Synthetic Integration Test',email:TEST_RECIPIENT,phone:'+44 20 7946 0000',office:'miami',pronouns:'mx',firstName:'Synthetic',lastName:'Integration',purpose:'other',educations:[
 {school:'Synthetic University',country:'GB',degree:'Test Bachelor',start:'2014-09',end:'2018-06'},
 {school:'Synthetic University',country:'GB',degree:'Test Master',start:'2018-09',end:'2020-06'},
],notes:'Disposable isolated test fixture'};
data.evaluationRequest=selectEvaluationService(data.evaluationRequest,'course',2);
data.evaluationRequest.services.course={selected:true,tier:'sameDay',educationIndexes:[1]};
data.evaluationDelivery={report:'paper',extraCopies:2,shipping:'internationalFirst',address:{name:'Synthetic Recipient',country:'GB',street:'1 Test Road',street2:'',city:'Test City',region:'',postal:'TEST'}};
const input={requestId:randomUUID(),locale:'en',data};let id='';let checks=0;
function check(value:unknown,message:string){assert.ok(value,message);checks++;console.log('PASS '+message);}
async function http(path:string,body?:unknown,expected=200,originHeader=origin){const res=await fetch(origin+path,{method:body===undefined?'GET':'POST',headers:{Origin:originHeader,'Content-Type':'application/json'},body:body===undefined?undefined:JSON.stringify(body)});const result=await res.json();check(res.status===expected,`${path}: HTTP ${expected}`);return result;}
try{
 const outputs=await Promise.all(Array.from({length:5},()=>saveIntake(input)));id=outputs[0].id;
 check(outputs.every(row=>row.id===id)&&outputs.filter(row=>row.created).length===1,'five concurrent saves produce one Application ID');
 await assert.rejects(()=>saveIntake({...input,data:{...data,notes:'Changed'}}),e=>(e as {status:number}).status===409);check(true,'changed replay rejected');
 const receipt=await readIntake(id);check(receipt.quote.min===57000&&receipt.quote.max===61000,'same-day course, paper copies and international shipping snapshot');
 const [legacy]=await sql`select date_of_birth,phone,service_type from ${table('public.fce_applications')} where id=${id}`;
 check(legacy.date_of_birth===null&&legacy.phone===data.phone,'optional birthday and international phone preserved');
 const educationRows=await sql`select id,degree_obtained from ${table('public.fce_educations')} where application_id=${id}`;
 check(educationRows.length===2&&legacy.service_type.websiteQuote.selectedEducationIds.course[0]===educationRows.find(e=>e.degree_obtained==='Test Master')!.id,'CRM education association matches selected qualification');
 const miami=await workspaceSnapshot({q:id},{email:TEST_RECIPIENT,offices:['Miami'],include_unassigned:false});
 check(miami.rows.length===1&&miami.rows[0].intakeVersion===2&&miami.rows[0].service==='Course by Course','CRM reads the same test application and service');
 const boston=await workspaceSnapshot({q:id},{email:TEST_RECIPIENT,offices:['Boston'],include_unassigned:false});check(boston.rows.length===0,'office restrictions remain enforced');
 await sendIntakeEmail(id,async()=>{throw new Error('synthetic outage');});
 check((await readIntake(id)).email.state==='failed','mail failure retains saved application');
 let calls=0;const transport=async(mail:{recipient:string;id:string})=>{check(mail.recipient===TEST_RECIPIENT,'recipient pinned to approved test inbox');calls++;return 'synthetic-'+mail.id;};
 await sendIntakeEmail(id,transport);check(calls===0,'retry cooldown prevents immediate resend');
 await sql`update ${table('evaluation.intake_emails')} set available_at=now()-interval '1 second' where application_id=${id}`;
 await Promise.all([sendIntakeEmail(id,transport),sendIntakeEmail(id,transport)]);check(calls===1&&(await readIntake(id)).email.state==='sent','concurrent retries claim one email');
 await sendIntakeEmail(id,transport);check(calls===1,'sent email is not resent');
 const replay=await http('/api/application-intake',input);check(replay.id===id&&!replay.created,'HTTP replay returns original saved ID');
 const lookup=await http('/api/customer-status?source=preview',{applicationId:id});check(lookup.id===id&&!('access_hash' in lookup)&&!('staff_notes' in lookup),'status returns explicit customer fields only');
 check(lookup.source==='preview'&&lookup.portalUrl===null&&lookup.deadline===null,'test status has no production payment destination or synthetic deadline');
 check(lookup.client.name===data.contactName&&lookup.educations.length===2&&lookup.details.quote.min===57000&&lookup.details.request.services.course.educationIndexes[0]===1,'shared status contract preserves contact, education, selected service and frozen quote');
 await http('/api/customer-status',{applicationId:id},404);
 await http('/api/customer-status?source=preview',{applicationId:randomUUID()},404);
 await http('/api/application-intake/'+id,undefined,401);
 await http('/api/staff-workspace?source=preview',undefined,401);
 await http('/api/application-intake',input,403,'https://example.invalid');
 await http('/api/application-intake',{...input,data:{...data,service:'translation'}},400);
 await http('/api/application-intake',{...input,data:{...data,notes:'Changed'}},409);
 const [permissions]=await sql`select has_table_privilege(current_user,'public.fce_applications','INSERT') as production_write`;
 check(!permissions.production_write,'runtime role cannot insert production applications');
 console.log(`Completed ${checks} integration checks; real email transport was not used.`);
}finally{
 if(id)await sql.begin(async tx=>{await tx`delete from ${table('evaluation.applications')} where id=${id} and request_id=${input.requestId}`;await tx`delete from ${table('public.fce_applications')} where id=${id}`;});
 await sql.end();
}
