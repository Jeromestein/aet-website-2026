/** Prepare a reconciled artifact in an owned local database, never hosted storage. */
import {execFileSync} from 'node:child_process';
import {mkdtempSync,readFileSync,writeFileSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {createHash} from 'node:crypto';
import postgres from 'postgres';
import {convergeHistoricalPreevaluation} from './converge-preeval-history';
import {simplifyPreevaluationNine} from './simplify-preeval-nine';
import {simplifyPreevaluationEight} from './simplify-preeval-eight';
import {simplifyPreevaluationSix} from './simplify-preeval-six';
const directory=process.argv[2],pg=process.env.APPLICATION_CORE_TEST_PG_BIN;
if(!directory||!pg)throw Error('Explicit snapshot directory and local PostgreSQL binaries required');
const snapshot=JSON.parse(readFileSync(join(directory,'snapshot.json'),'utf8'));
const verified=JSON.parse(readFileSync(join(directory,'verified.json'),'utf8'));
if(snapshot.project!=='qrxztgdemfodemlcabcq')throw Error('Unexpected snapshot project');
const schemas:Record<string,string>={aet_preview_core:'aet',aet_preview_preeval:'preeval',aet_preview_evaluation:'evaluation',aet_preview_legacy:'public'};
const names=Object.keys(snapshot.tables).sort();
if(names.length!==32||names.some(n=>!schemas[n.split('.')[0]]||!/^[a-z_]+\.[a-z_]+$/.test(n)))throw Error('Unexpected source inventory');
const local=(n:string)=>{const[s,t]=n.split('.');return schemas[s]+'.'+t;};
const temp=mkdtempSync(join(tmpdir(),'aet-six-prepare-'));
let started=false,sql:ReturnType<typeof postgres>|undefined;
const read=(f:string)=>readFileSync(new URL('../../'+f,import.meta.url),'utf8');
try{
 execFileSync(join(pg,'initdb'),['-D',join(temp,'data'),'-U','core_rehearsal','-A','trust','--locale=C','--encoding=UTF8'],{stdio:'pipe'});
 execFileSync(join(pg,'pg_ctl'),['-D',join(temp,'data'),'-l',join(temp,'pg.log'),'-o',`-F -k ${temp} -h '' -p 55449`,'-w','start'],{stdio:'pipe'});started=true;
 const options={host:temp,port:55449,username:'core_rehearsal',max:1,onnotice:()=>{}};
 const admin=postgres({...options,database:'postgres'});try{await admin.unsafe('create database aet_core_rehearsal');}finally{await admin.end();}
 sql=postgres({...options,database:'aet_core_rehearsal'});
 await sql.unsafe('create role anon; create role authenticated; create role aet_preview_runtime;');
 for(const f of ['20261002000100_pre_evaluation.sql','20261002000200_formal_evaluation.sql','20261002000300_evaluation_workflow.sql','20261020165103_email_delivery_records.sql','20261020173355_formal_email_delivery_records.sql','20261020230256_application_document_locations.sql','20261020232924_preeval_gpt_analysis.sql'])await sql.unsafe(read('supabase/migrations/'+f));
 await sql.unsafe(read('scripts/legacy/schema-fixture.sql'));
 await sql.unsafe(read('scripts/staff/intake-preview.sql').replaceAll('aet_preview_legacy.','public.').replaceAll('aet_preview_evaluation.','evaluation.'));
 await sql.unsafe(read('supabase/migrations/20261106220126_shared_application_core.sql'));
 const order=names.filter(n=>n.endsWith('.applications')||n.endsWith('.aet_core_applications')||n.endsWith('.fce_applications'));order.push(...names.filter(n=>!order.includes(n)));
 for(const name of order){
  const columns=snapshot.columns.filter((c:any)=>c.table_schema+'.'+c.table_name===name&&c.is_generated==='NEVER').map((c:any)=>'"'+c.column_name+'"').join(',');
  if(snapshot.tables[name].length)await sql.unsafe(`insert into ${local(name)} (${columns}) overriding system value select ${columns} from jsonb_populate_recordset(null::${local(name)},$1::text::jsonb)`,[JSON.stringify(snapshot.tables[name])]);
  if(snapshot.columns.some((c:any)=>c.table_schema+'.'+c.table_name===name&&c.column_name==='id')){
   const [seq]=await sql`select pg_get_serial_sequence(${local(name)},'id') name`;
   if(seq.name)await sql.unsafe(`select setval($1::regclass,greatest(coalesce((select max(id) from ${local(name)}),0),1),true)`,[seq.name]);
  }
 }
 const apps=snapshot.tables['aet_preview_preeval.applications'];
 if(!apps.every((a:any)=>a.first_name.startsWith('AET ')&&a.last_name.includes('Test')))throw Error('Only the verified synthetic Preview cohort is accepted');
 const migration=await convergeHistoricalPreevaluation(sql,{providerAccount:verified.providerAccount,
  payments:verified.payments.map((p:any)=>({id:p.id,applicationId:p.applicationId,amountCents:p.session.amount_total,currency:p.session.currency,checkoutSessionId:p.session.id,paymentIntentId:p.intent.id,status:p.session.payment_status,refundedCents:p.intent.latest_charge.amount_refunded,providerMode:'test'})),
  cohort:apps.map((a:any)=>({applicationId:a.id,noChargeAuditId:snapshot.tables['aet_preview_preeval.audit'].find((e:any)=>e.application_id===a.id&&e.action==='test.payment_fixture')?.id?.toString(),evidence:{verifiedServicePrice:{amountCents:1900,currency:'USD',source:'automatic'},files:verified.files.filter((f:any)=>snapshot.tables['aet_preview_preeval.files'].some((d:any)=>d.id===f.legacyFileId&&d.application_id===a.id))}}))});
 const nine=await simplifyPreevaluationNine(sql),eight=await simplifyPreevaluationEight(sql),six=await simplifyPreevaluationSix(sql);
 const tables:Record<string,any[]>={};
 for(const name of six.tables)tables[name]=(await sql`select to_jsonb(t) value from ${sql('aet.'+name)} t order by to_jsonb(t)::text`).map(r=>r.value);
 const ddl=execFileSync(join(pg,'pg_dump'),['-h',temp,'-p','55449','-U','core_rehearsal','-d','aet_core_rehearsal','--schema-only','--schema=aet','--no-owner','--no-privileges'],{encoding:'utf8'});
 writeFileSync(join(directory,'six-schema.sql'),ddl,{mode:0o600});
 writeFileSync(join(directory,'six-prepared.json'),JSON.stringify({sourceDigest:createHash('sha256').update(JSON.stringify(snapshot.tables)).digest('hex'),tables,migration,archives:{nine,eight,six}}),{mode:0o600});
 console.log({prepared:true,tableCounts:Object.fromEntries(Object.entries(tables).map(([k,v])=>[k,v.length])),hostedChanges:false});
}finally{
 await sql?.end({timeout:1});
 if(started)execFileSync(join(pg,'pg_ctl'),['-D',join(temp,'data'),'-m','immediate','-w','stop'],{stdio:'pipe'});
 rmSync(temp,{recursive:true,force:true});
}
