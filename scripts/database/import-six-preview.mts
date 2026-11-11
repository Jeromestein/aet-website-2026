/** Import a reconciled local artifact into the private hosted Preview target only. */
import {readFileSync,writeFileSync} from 'node:fs';
import {join} from 'node:path';
import {createHash} from 'node:crypto';
import postgres from 'postgres';
const dir=process.argv[2];if(!dir)throw Error('Private snapshot directory required');
const snapshot=JSON.parse(readFileSync(join(dir,'snapshot.json'),'utf8'));
const prepared=JSON.parse(readFileSync(join(dir,'six-prepared.json'),'utf8'));
const u=new URL(process.env.STAFF_AUTH_DATABASE_URL||'');
if(snapshot.project!=='qrxztgdemfodemlcabcq'||!decodeURIComponent(u.username).endsWith('.qrxztgdemfodemlcabcq')||!u.hostname.endsWith('.pooler.supabase.com'))throw Error('Unexpected Preview project');
if(createHash('sha256').update(JSON.stringify(snapshot.tables)).digest('hex')!==prepared.sourceDigest)throw Error('Artifact does not match snapshot');
const normalize=(v:any):any=>Array.isArray(v)?v.map(normalize):v&&typeof v==='object'?Object.fromEntries(Object.keys(v).sort().map(k=>[k,normalize(v[k])])):v;
const digest=(v:any)=>createHash('sha256').update(JSON.stringify(normalize(v))).digest('hex');
const names=['aet_core_applications','aet_education','aet_documents','aet_payments','aet_service_detail','aet_ai_runs'];
if(Object.keys(prepared.tables).sort().join()!==[...names].sort().join())throw Error('Exact six-table artifact required');
const sql=postgres(u.toString(),{prepare:false,max:1,connect_timeout:10,onnotice:()=>{}});
try{const report=await sql.begin('isolation level serializable',async tx=>{
 const sourceNames=Object.keys(snapshot.tables).sort();
 if(sourceNames.length!==32||sourceNames.some(n=>!/^aet_preview_(core|legacy|preeval|evaluation)\.[a-z_]+$/.test(n)))throw Error('Unexpected source inventory');
 for(const name of sourceNames){
  await tx`lock table ${tx(name)} in share mode`;
  const rows=(await tx`select to_jsonb(t) value from ${tx(name)} t order by to_jsonb(t)::text`).map(r=>r.value);
  if(digest(rows)!==digest(snapshot.tables[name]))throw Error('Source changed since capture: '+name);
 }
 const [grants]=await tx`select exists(select 1 from pg_tables where schemaname in ('aet_preview_preeval','aet_preview_core') and has_table_privilege('aet_preview_runtime',quote_ident(schemaname)||'.'||quote_ident(tablename),'INSERT,UPDATE,DELETE,TRUNCATE')) as writable`;
 if(grants.writable)throw Error('Source writers must be frozen');
 const counts:Record<string,number>={};
 for(const name of names){
  const table='aet_preview_shared.'+name;await tx`lock table ${tx(table)} in access exclusive mode`;
  if((await tx`select 1 from ${tx(table)} limit 1`).length)throw Error('Target is not empty');
  const columns=(await tx`select column_name from information_schema.columns where table_schema='aet_preview_shared' and table_name=${name} and is_generated='NEVER' order by ordinal_position`).map(c=>'"'+c.column_name+'"').join(',');
  if(prepared.tables[name].length)await tx.unsafe(`insert into ${table} (${columns}) overriding system value select ${columns} from jsonb_populate_recordset(null::${table},$1::text::jsonb)`,[JSON.stringify(prepared.tables[name])]);
  const rows=(await tx`select to_jsonb(t) value from ${tx(table)} t order by to_jsonb(t)::text`).map(r=>r.value);
  // Normalize typed PostgreSQL values (especially timestamp offsets) without losing precision.
  const expected=(await tx.unsafe(`select to_jsonb(t) value from jsonb_populate_recordset(null::${table},$1::text::jsonb) t order by to_jsonb(t)::text`,[JSON.stringify(prepared.tables[name])])).map(r=>r.value);
  if(digest(rows)!==digest(expected))throw Error('Imported row mismatch: '+name);
  counts[name]=rows.length;
 }
 return {importedAt:new Date().toISOString(),sourceDigest:prepared.sourceDigest,counts,productionChanges:false};
});writeFileSync(join(dir,'import-report.json'),JSON.stringify(report),{mode:0o600});console.log(report);
}finally{await sql.end();}
