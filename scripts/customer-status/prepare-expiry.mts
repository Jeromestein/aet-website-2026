import assert from 'node:assert/strict';
import { randomBytes, randomUUID } from 'node:crypto';
import { readFile, writeFile, chmod, stat } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import { parseEnv } from 'node:util';
import postgres from 'postgres';
import { CLOUD_PROJECT } from '../../lib/preeval/config';
import { EXPIRY_ROLE, expiryConnection } from '../../lib/customer-status/expiry';

// Explicit administrative provisioning only. Never invoked by the application or Cron.
assert.equal(process.env.PREPARE_STATUS_EXPIRY, 'true', 'Explicit provisioning opt-in required');
const root = new URL('../../', import.meta.url);
const secretFile = new URL('../../.env.local', import.meta.url);
execFileSync('git', ['check-ignore', '--quiet', '.env.local'], {cwd:root});
const adminUrl = new URL(process.env.STAFF_AUTH_DATABASE_URL!);
assert.ok(adminUrl.hostname === `db.${CLOUD_PROJECT}.supabase.co` ||
  (adminUrl.hostname.endsWith('.pooler.supabase.com') && decodeURIComponent(adminUrl.username).endsWith(`.${CLOUD_PROJECT}`)), 'Unexpected project');
const sql = postgres(adminUrl.href, {max:1,prepare:false,onnotice:()=>{},connect_timeout:10,connection:{statement_timeout:15000,lock_timeout:3000}});
let runtime: ReturnType<typeof postgres> | undefined;
let checks=0;
function check(ok:unknown){assert.ok(ok);checks++;}
async function fingerprint(){return (await sql`select count(*)::int as count, md5(coalesce(string_agg(concat_ws('|',id,status,payment_status,submitted_at,paid_at,updated_at),';' order by id),'')) as digest from public.fce_applications`)[0];}
try {
 const before = await fingerprint();
 const priorPolicies = await sql`select policyname,cmd,roles,qual,with_check from pg_policies where schemaname='public' and tablename='fce_applications' and policyname not like 'aet_payment_expiry_%' order by policyname`;
 const existing = await sql`select rolname from pg_roles where rolname=${EXPIRY_ROLE}`;
 let saved:Record<string,string>|undefined;
 let savedText='';
 try{savedText=await readFile(secretFile,'utf8');saved=parseEnv(savedText);}catch(e){if((e as NodeJS.ErrnoException).code!=='ENOENT')throw e;}
 if(existing.length)assert.ok(saved?.STATUS_EXPIRY_DATABASE_URL,'Existing role requires its saved credentials; refusing password rotation');
 const target = saved?.STATUS_EXPIRY_DATABASE_URL ? new URL(expiryConnection(saved.STATUS_EXPIRY_DATABASE_URL)) : new URL(adminUrl);
 if(!saved?.STATUS_EXPIRY_DATABASE_URL){
  target.username=adminUrl.hostname.startsWith('db.')?EXPIRY_ROLE:`${EXPIRY_ROLE}.${CLOUD_PROJECT}`;
  target.password=randomBytes(36).toString('hex');
  target.searchParams.set('sslmode','require');
 }
 const password=decodeURIComponent(target.password);assert.match(password,/^[0-9a-f]{72}$/);
 const cronSecret=saved?.CRON_SECRET || process.env.CRON_SECRET || randomBytes(32).toString('hex');
 assert.ok(cronSecret.length>=16 && !/[\r\n]/.test(cronSecret));
 const additions: string[] = [];
 for (const [key,value] of Object.entries({STATUS_EXPIRY_DATABASE_URL:target.href,CRON_SECRET:cronSecret,STATUS_EXPIRY_ENABLED:'false'})) {
  if (!saved?.[key]) additions.push(key+'='+value);
 }
 if (additions.length) {
  const current = await readFile(secretFile,'utf8').catch((error: NodeJS.ErrnoException) => {if(error.code==='ENOENT')return '';throw error;});
  assert.equal(current === savedText,true,'Local configuration changed during preparation');
  await writeFile(secretFile,savedText.trimEnd()+'\n\n# Formal payment expiry (disabled locally; enable only in Vercel Production).\n'+additions.join('\n')+'\n',{mode:0o600});
 }
 await chmod(secretFile,0o600);
 await sql.begin(async tx=>{
  await tx.unsafe(await readFile(new URL('./expiry-role.sql',import.meta.url),'utf8'));
  if(!existing.length)await tx.unsafe(`alter role ${EXPIRY_ROLE} login password '${password}' connection limit 3`);
  const [flags]=await tx`select rolcanlogin and not rolsuper and not rolbypassrls and not rolcreaterole and not rolcreatedb and not rolinherit as safe from pg_roles where rolname=${EXPIRY_ROLE}`;check(flags.safe);
  const cols=await tx`select column_name,has_column_privilege(${EXPIRY_ROLE},'public.fce_applications',column_name,'SELECT') as readable,has_column_privilege(${EXPIRY_ROLE},'public.fce_applications',column_name,'UPDATE') as writable from information_schema.columns where table_schema='public' and table_name='fce_applications'`;
  check(cols.every(c=>c.readable===['id','status','payment_status','submitted_at'].includes(c.column_name)));
  check(cols.every(c=>c.writable===(c.column_name==='payment_status')));
  for(const table of ['public.users','auth.users','aet_private.staff_accounts','public.fce_educations','public.aet_core_payments']){
   const [rights]=await tx`select has_table_privilege(${EXPIRY_ROLE},${table},'SELECT') or has_table_privilege(${EXPIRY_ROLE},${table},'UPDATE') as allowed`;check(!rights.allowed);
  }
 });
 runtime=postgres(expiryConnection(target.href),{max:1,prepare:false,connect_timeout:10,connection:{statement_timeout:15000}});
 check((await runtime`select current_user`)[0].current_user===EXPIRY_ROLE);
 await runtime`select id,status,payment_status,submitted_at from public.fce_applications limit 0`;checks++;
 for(const query of ['select email from public.fce_applications limit 0','update public.fce_applications set status=status where false','delete from public.fce_applications where false','select 1 from public.users limit 0']){
  await assert.rejects(runtime.unsafe(query),(e:any)=>e.code==='42501');checks++;
 }
 // Exercise actual installed RLS against synthetic rows, in a fully rolled-back transaction.
 const rollback=new Error('rollback-fixtures');const ids=[randomUUID(),randomUUID(),randomUUID()];
 try{await sql.begin(async tx=>{
  await tx.unsafe(`grant ${EXPIRY_ROLE} to current_user`);
  for(let i=0;i<ids.length;i++)await tx`insert into public.fce_applications(id,status,name,country,street_address,city,region,zip_code,phone,email,purpose,pronouns,first_name,last_name,date_of_birth,service_type,delivery_method,payment_status,submitted_at)
   values(${ids[i]},'submitted','Synthetic Expiry Test','US','1 Test Street','Test City','CA','90000','555-555-0100','expiry-test@example.invalid','evaluation-education','mx','Synthetic','Expiry','2000-01-01','{}','no_delivery_needed',${i===1?'paid':'pending'},now()-${i===2?1:49}*interval '1 hour')`;
  await tx.unsafe('set local role '+EXPIRY_ROLE);
  await assert.rejects(tx.savepoint(async scoped=>{await scoped`update public.fce_applications set payment_status='paid' where id=${ids[0]}`;}),(e:any)=>e.code==='42501');checks++;
  check((await tx`update public.fce_applications set payment_status='expired' where id=${ids[0]} returning id`).length===1);
  check((await tx`update public.fce_applications set payment_status='expired' where id=${ids[0]} returning id`).length===0);
  check((await tx`update public.fce_applications set payment_status='expired' where id=${ids[1]} returning id`).length===0);
  check((await tx`update public.fce_applications set payment_status='expired' where id=${ids[2]} returning id`).length===0);
  await tx.unsafe('reset role');throw rollback;
 });}catch(e){if(e!==rollback)throw e;}
 check((await sql`select 1 from public.fce_applications where id in ${sql(ids)}`).length===0);
 check(JSON.stringify(before)===JSON.stringify(await fingerprint()));
 check(JSON.stringify(priorPolicies)===JSON.stringify(await sql`select policyname,cmd,roles,qual,with_check from pg_policies where schemaname='public' and tablename='fce_applications' and policyname not like 'aet_payment_expiry_%' order by policyname`));
 check(!(await sql`select has_column_privilege('aet_crm_runtime','public.fce_applications','payment_status','UPDATE') as allowed`)[0].allowed);
 check(((await stat(secretFile)).mode&0o777)===0o600);
 const [eligible]=await runtime`select count(*)::int as count from public.fce_applications where status in ('submitted','cancelled') and payment_status='pending' and submitted_at<now()-interval '48 hours'`;
 console.log(JSON.stringify({role:EXPIRY_ROLE,checks,eligible:eligible.count,secretFile:secretFile.pathname,productionTaskRun:false,businessRowsUnchanged:true,existingPoliciesUnchanged:true}));
}catch(e){console.error('Expiry preparation failed:',(e as any).code||'validation');process.exitCode=1;}
finally{await runtime?.end();await sql.end();}
