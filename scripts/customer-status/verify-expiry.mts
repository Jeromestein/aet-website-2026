import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import {readFile} from 'node:fs/promises';
import postgres from 'postgres';
import {expireApplications,EXPIRY_BATCH_SIZE} from '../../lib/customer-status/expiry';
// Everything, including the disposable role/schema, rolls back. No business rows are touched.
const sql=postgres(process.env.STAFF_AUTH_DATABASE_URL!,{max:1,prepare:false,onnotice:()=>{},connection:{statement_timeout:20000}});
const suffix=randomUUID().replaceAll('-','');const schema='expiry_test_'+suffix,role='expiry_test_'+suffix;
const relation=schema+'.applications';const rollback=new Error('rollback');let checks=0;
function check(ok:unknown){assert.ok(ok);checks++;}
try{
 try{await sql.begin(async tx=>{
  await tx.unsafe(`create schema ${schema}`);
  await tx.unsafe(`create table ${relation}(id uuid primary key,status text,payment_status text,submitted_at timestamptz,private_note text)`);
  await tx.unsafe(`alter table ${relation} enable row level security`);
  const setup=(await readFile(new URL('./expiry-role.sql',import.meta.url),'utf8')).replaceAll('public.fce_applications',relation).replaceAll('schema public','schema '+schema).replaceAll('aet_payment_expiry',role);
  await tx.unsafe(setup);
  await tx.unsafe(`grant ${role} to current_user`);
  // A permissive PUBLIC policy must not permit this role to mark a row paid.
  await tx.unsafe(`create policy broad_public on ${relation} for all to public using(true) with check(true)`);
  const rows=[
   ['submitted','pending',49],['cancelled','pending',49],['submitted','pending',48],['submitted','pending',47],
   ['submitted','paid',50],['processing','pending',50],['completed','pending',50],['submitted','refunded',50],
   ['submitted','failed',50],['submitted','expired',50],['submitted','pending',null],
  ] as const;
  const ids:string[]=[];
  for(const [status,payment,hours] of rows){const id=randomUUID();ids.push(id);await tx`insert into ${tx(relation)} values(${id},${status},${payment},now()-${hours} * interval '1 hour','private')`;}
  const worker=tx as unknown as ReturnType<typeof postgres>;
  await tx.unsafe('set local role '+role);
  await assert.rejects(tx.savepoint(async scoped=>{await scoped`select private_note from ${scoped(relation)}`;}),(e:any)=>e.code==='42501');checks++;
  await assert.rejects(tx.savepoint(async scoped=>{await scoped`update ${scoped(relation)} set payment_status='paid' where id=${ids[0]}`;}),(e:any)=>e.code==='42501');checks++;
  const first=await expireApplications(worker,relation);check(first.expired===2&&!first.batchFull);
  check((await expireApplications(worker,relation)).expired===0);
  const payments=await tx`select id,payment_status from ${tx(relation)}`;
  for(let i=0;i<ids.length;i++)check(payments.find(r=>r.id===ids[i])?.payment_status===(i<2?'expired':rows[i][1]));
  await tx.unsafe('reset role');
  await tx`insert into ${tx(relation)} select gen_random_uuid(),'submitted','pending',now()-interval '49 hours','private' from generate_series(1,${EXPIRY_BATCH_SIZE+1})`;
  await tx.unsafe('set local role '+role);
  check((await expireApplications(worker,relation)).batchFull===true);
  check((await expireApplications(worker,relation)).expired===1);
  await tx.unsafe('reset role');
  throw rollback;
 });}catch(e){if(e!==rollback)throw e;}
 check((await sql`select 1 from pg_namespace where nspname=${schema}`).length===0);
 check((await sql`select 1 from pg_roles where rolname=${role}`).length===0);
 console.log(`${checks} SQL expiry/permission checks passed; fixtures, policies and test role rolled back.`);
}catch(e){console.error('Expiry integration failed:',(e as any).code||'assertion',(e as Error).message);process.exitCode=1;}finally{await sql.end();}
