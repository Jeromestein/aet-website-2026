import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { db } from '../../lib/preeval/db';
import { initialData, quote } from '../../lib/evaluation-application/domain';
import { saveLegacyFormal, saveLegacyPreeval } from '../../lib/legacy-application/store';
import { fromLegacyFormal } from '../../lib/legacy-application/mapping';
let checks = 0;
function check(value: unknown, message: string) { assert.ok(value, message); console.log('PASS '+message); checks++; }
async function main() {
 const sql = db();
 try {
  const expected = JSON.parse(await readFile(new URL('./schema-metadata.json',import.meta.url),'utf8'));
  const actual = await sql`select t.relname as table_name,a.attname as name,format_type(a.atttypid,a.atttypmod) as type,a.attnotnull as required,pg_get_expr(d.adbin,d.adrelid) as default_value from pg_class t join pg_namespace n on n.oid=t.relnamespace join pg_attribute a on a.attrelid=t.oid left join pg_attrdef d on d.adrelid=t.oid and d.adnum=a.attnum where n.nspname='public' and t.relname in ('aet_core_applications','aet_core_educations','aet_core_payments','fce_applications','fce_educations') and a.attnum>0 and not a.attisdropped order by t.relname,a.attnum`;
  assert.deepEqual([...actual],expected.columns); check(true,'all five local tables retain the captured legacy columns, types, nullability and defaults');
  const constraints = await sql`select t.relname as table_name,c.conname as name,c.contype as type,pg_get_constraintdef(c.oid) as definition from pg_constraint c join pg_class t on t.oid=c.conrelid join pg_namespace n on n.oid=t.relnamespace where n.nspname='public' and t.relname in ('aet_core_applications','aet_core_educations','aet_core_payments','fce_applications','fce_educations') order by t.relname,c.conname`;
  assert.deepEqual([...constraints],expected.constraints); check(true,'legacy primary keys, relationships and validation constraints are unchanged');
  const rollback = new Error('ROLLBACK_SYNTHETIC_FIXTURES');
  try { await sql.begin(async tx=>{
    const id = randomUUID(), requestId = randomUUID(), data = initialData();
    Object.assign(data.client,{name:'Fictional Contract Test',country:'US',street:'123 Test Street',street2:'Unit 4',city:'Miami',region:'FL',postal:'33101',phone:'202-555-0149',fax:'202-555-0150',email:'contract@example.test',office:'Miami',purpose:'education'});
    data.evaluee={title:'mx',first:'Synthetic',middle:'Only',last:'Fixture',birth:'1990-01-02'};
    data.educations=[{school:'Fictional First University',country:'CN',degree:'Bachelor',start:'2008-09',end:'2012-06'},{school:'Fictional Second University',country:'CA',degree:'Master',start:'2013-09',end:'2015-06'}];
    data.services.expert.tier='rush'; data.notes='Rollback-only compatibility fixture'; data.terms=true;
    const q = quote(data);
    await tx`insert into evaluation.applications(id,request_id,request_hash,access_hash,locale,data,quote) values(${id},${requestId},'fixture','fixture','en',${tx.json(data)},${tx.json(q)})`;
    await saveLegacyFormal(tx,id,data,q);
    const [row]=await tx`select * from public.fce_applications where id=${id}`;
    const educationRows=await tx`select * from public.fce_educations where application_id=${id} order by array_position(${row.service_type.websiteQuote.educationIds}::text[],id::text)`;
    check(educationRows.length===2&&new Set(educationRows.map(e=>e.id)).size===2,'formal education rows have independent stable IDs and preserve order');
    assert.deepEqual(fromLegacyFormal(row,educationRows,initialData()),{...data,terms:false});check(true,'all formal business fields round-trip through the legacy database');
    check(row.service_type.professionalExperience.speed==='14day'&&row.due_amount==='710.00','current website price and actual expert turnaround survive storage');
    check(row.current_step===3&&row.submitted_at&&row.payment_status==='pending','legacy submission and payment defaults are preserved');
    const paymentId=randomUUID();
    await tx`insert into evaluation.payments(id,application_id,amount_cents,status,payment_intent) values(${paymentId},${id},71000,'paid','pi_synthetic')`;
    await tx`update evaluation.applications set payment_status='paid',status='processing' where id=${id}`;
    const [paid]=await tx`select * from public.fce_applications where id=${id}`;
    check(paid.payment_status==='paid'&&paid.payment_id==='pi_synthetic'&&paid.paid_at&&paid.status==='processing','local payment/status transitions populate original business columns');
    await tx`update evaluation.applications set status='needs_information' where id=${id}`;
    check((await tx`select status from public.fce_applications where id=${id}`)[0].status==='processing','new internal statuses do not violate legacy status constraints');
    const preId=randomUUID(), educationId=randomUUID();
    const pre={requestId:randomUUID(),locale:'en' as const,email:'pre-contract@example.test',firstName:'Synthetic',middleName:'',lastName:'Test',country:'US',schoolName:'Fictional College',countryOfStudy:'CN',degreeObtained:'Bachelor',startDate:'2010-09',endDate:'2014-06',terms:true as const};
    await tx`insert into preeval.applications(id,request_id,request_hash,email,first_name,last_name,country,locale) values(${preId},${pre.requestId},'fixture',${pre.email},${pre.firstName},${pre.lastName},${pre.country},'en')`;
    await saveLegacyPreeval(tx,preId,educationId,pre);
    await tx`insert into preeval.educations(id,application_id,school_name,country_of_study,degree_obtained,start_date,end_date) values(${educationId},${preId},${pre.schoolName},${pre.countryOfStudy},${pre.degreeObtained},${pre.startDate},${pre.endDate})`;
    const [core]=await tx`select * from public.aet_core_applications where id=${preId}`;
    check(core.purpose==='degree-equivalency'&&core.middle_name===null&&core.email===pre.email,'pre-evaluation uses the existing purpose and name/contact columns');
    await tx`update preeval.applications set result='{"result":"Bachelor degree","reasoning":"Synthetic result for compatibility only."}'::jsonb where id=${preId}`;
    const [edu]=await tx`select * from public.aet_core_educations where id=${educationId}`;
    assert.deepEqual(edu.study_start_date,{month:'09',year:'2010'});check(edu.ai_output==='Bachelor degree','legacy education keeps month/year dates and its own AI result');
    const secondId=randomUUID();
    await tx`insert into public.aet_core_educations select ${secondId}::uuid,application_id,country_of_study,degree_obtained,school_name,study_start_date,study_end_date,'"Existing second degree"'::jsonb from public.aet_core_educations where id=${educationId}`;
    await tx`update preeval.applications set result='{"result":"Updated first degree","reasoning":"Synthetic correction only."}'::jsonb where id=${preId}`;
    check((await tx`select ai_output from public.aet_core_educations where id=${secondId}`)[0].ai_output==='Existing second degree','additional historical education results are not overwritten or discarded');
    await tx`insert into preeval.payments(application_id,amount_cents,status,payment_intent) values(${preId},1988,'paid','pi_pre_synthetic')`;
    const [prePayment]=await tx`select * from public.aet_core_payments where application_id=${preId}`;
    check(prePayment.due_amount==='19.88'&&prePayment.payment_status==='paid'&&prePayment.paid_at,'pre-evaluation payment uses the original payment table and dollar amount');
    await tx`update preeval.applications set country='CA' where id=${preId}`;
    check((await tx`select country from preeval.applications where id=${preId}`)[0].country==='CA','residence country remains in auxiliary storage without changing the old table');
    throw rollback;
  }); } catch(error) { if(error!==rollback) throw error; }
  console.log(`${checks} legacy compatibility checks passed. All synthetic records rolled back; no email, AI, payment or upload was sent.`);
 } finally { await sql.end(); }
}
main().catch(error=>{console.error(error);process.exitCode=1});
