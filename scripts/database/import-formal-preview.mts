/** Import only a reconciled formal cohort into the six private Preview tables.
 * Source writers must be frozen; pre-evaluation and Production are untouched. */
import {readFileSync,writeFileSync} from 'node:fs';
import {join} from 'node:path';
import {createHash} from 'node:crypto';
import postgres from 'postgres';
const dir=process.argv[2];if(!dir)throw Error('Private artifact directory required');
const snapshot=JSON.parse(readFileSync(join(dir,'snapshot.json'),'utf8')),prepared=JSON.parse(readFileSync(join(dir,'prepared.json'),'utf8'));
const normalize=(v:any):any=>Array.isArray(v)?v.map(normalize):v&&typeof v==='object'?Object.fromEntries(Object.keys(v).sort().map(k=>[k,normalize(v[k])])):v;
const digest=(v:any)=>createHash('sha256').update(JSON.stringify(normalize(v))).digest('hex');
const u=new URL(process.env.STAFF_AUTH_DATABASE_URL||'');
if(snapshot.project!=='qrxztgdemfodemlcabcq'||!decodeURIComponent(u.username).endsWith('.qrxztgdemfodemlcabcq')||!u.hostname.endsWith('.pooler.supabase.com'))throw Error('Unexpected Preview project');
if(digest(snapshot.tables)!==prepared.sourceDigest)throw Error('Snapshot/artifact mismatch');
const sources=Object.keys(snapshot.tables).filter(n=>!n.startsWith('aet_preview_shared.')).sort();
if(sources.length!==12||sources.some(n=>!/^aet_preview_(evaluation\.[a-z_]+|legacy\.fce_(applications|educations))$/.test(n)))throw Error('Unexpected source tables');
const names=['aet_core_applications','aet_education','aet_documents','aet_payments','aet_service_detail','aet_ai_runs'];
if(Object.keys(prepared.tables).sort().join()!==[...names].sort().join())throw Error('Unexpected target inventory');
if([...prepared.ids].sort().join()!==snapshot.tables['aet_preview_evaluation.applications'].map((r:any)=>r.id).sort().join())throw Error('Cohort mismatch');
for(const name of names)if(prepared.tables[name].some((r:any)=>!prepared.ids.includes(name==='aet_core_applications'?r.id:r.application_id)))throw Error('Out-of-cohort row');
const sql=postgres(u.toString(),{prepare:false,max:1,onnotice:()=>{},connection:{statement_timeout:30000}});
try{const report=await sql.begin('isolation level serializable',async tx=>{
 await tx`set local lock_timeout='5s'`;
 const [role]=await tx`select exists(select 1 from pg_class c join pg_namespace n on n.oid=c.relnamespace where n.nspname in ('public','preeval','evaluation','aet') and c.relkind in ('r','p') and has_table_privilege('aet_preview_runtime',c.oid,'INSERT,UPDATE,DELETE,TRUNCATE')) production_write`;
 if(role.production_write)throw Error('Preview isolation invalid');
 for(const name of sources){
  await tx`lock table ${tx(name)} in share mode`;
  const [grant]=await tx`select has_table_privilege('aet_preview_runtime',${name},'INSERT,UPDATE,DELETE,TRUNCATE') writable`;if(grant.writable)throw Error('Source writers must be frozen');
  const rows=(await tx`select to_jsonb(t) value from ${tx(name)} t order by to_jsonb(t)::text`).map(r=>r.value);
  if(digest(rows)!==digest(snapshot.tables[name]))throw Error('Source changed: '+name);
 }
 if((await tx`select id from aet_preview_shared.aet_core_applications where id=any(${prepared.ids}::uuid[]) or primary_service='evaluation'`).length)throw Error('Formal target is not empty');
 const counts:Record<string,number>={};
 for(const name of names){
  const relation='aet_preview_shared.'+name;
  const columns=(await tx`select column_name from information_schema.columns where table_schema='aet_preview_shared' and table_name=${name} and is_generated='NEVER' order by ordinal_position`).map(c=>'"'+c.column_name+'"').join(',');
  if(prepared.tables[name].length)await tx.unsafe(`insert into ${relation} (${columns}) select ${columns} from jsonb_populate_recordset(null::${relation},$1::text::jsonb)`,[JSON.stringify(prepared.tables[name])]);
  const column=name==='aet_core_applications'?'id':'application_id';
  const actual=(await tx`select to_jsonb(t) value from ${tx(relation)} t where ${tx(column)}=any(${prepared.ids}::uuid[]) order by to_jsonb(t)::text`).map(r=>r.value);
  const expected=(await tx.unsafe(`select to_jsonb(t) value from jsonb_populate_recordset(null::${relation},$1::text::jsonb) t order by to_jsonb(t)::text`,[JSON.stringify(prepared.tables[name])])).map(r=>r.value);
  if(digest(actual)!==digest(expected))throw Error('Imported data mismatch: '+name);counts[name]=actual.length;
 }
 return {importedAt:new Date().toISOString(),counts,applicationIds:prepared.ids,productionChanges:false};
});writeFileSync(join(dir,'import-report.json'),JSON.stringify(report),{mode:0o600});console.log({counts:report.counts,productionChanges:false});}finally{await sql.end();}
