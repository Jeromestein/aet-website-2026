import {afterAll,beforeAll,describe,expect,it,vi} from 'vitest';
import {execFileSync} from 'node:child_process';
import {mkdtempSync,readFileSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import postgres from 'postgres';
vi.mock('server-only',()=>({}));
const holder=vi.hoisted(()=>({sql:undefined as ReturnType<typeof postgres>|undefined}));
vi.mock('../lib/preeval/db',async()=>{const {convergedTableName}=await import('../lib/application-core/convergence-mode');const {businessTableName}=await import('../lib/preeval/config');return {db:()=>holder.sql!,table:(name:string)=>holder.sql!(convergedTableName(holder.sql!,name)||businessTableName(name)),audit:async()=>{}};});
import {submitConverged,readConverged} from '../lib/application-core/converged-store';
import {randomUUID} from 'node:crypto';
import {activateSixTablePreview,convergenceConfiguration,convergedTableName} from '../lib/application-core/convergence-mode';
import {coreTable} from '../lib/application-core/connection';
const pg=process.env.APPLICATION_CORE_TEST_PG_BIN;
describe.skipIf(!pg)('six-table Preview connection and permissions',()=>{
 let dir:string,admin:ReturnType<typeof postgres>,runtime:ReturnType<typeof postgres>,started=false;
 beforeAll(async()=>{
  dir=mkdtempSync(join(tmpdir(),'aet-six-preview-'));
  execFileSync(join(pg!,'initdb'),['-D',join(dir,'data'),'-U','core_rehearsal','-A','trust','--locale=C','--encoding=UTF8'],{stdio:'pipe'});
  execFileSync(join(pg!,'pg_ctl'),['-D',join(dir,'data'),'-l',join(dir,'pg.log'),'-o',`-F -k ${dir} -h '' -p 55450`,'-w','start'],{stdio:'pipe'});started=true;
  const options={host:dir,port:55450,database:'postgres',max:1,onnotice:()=>{}};
  admin=postgres({...options,username:'core_rehearsal'});
  await admin.unsafe('create role anon; create role authenticated; create role aet_preview_runtime login;');
  await admin.unsafe(readFileSync(new URL('../supabase/migrations/20261111010750_preview_six_table_core.sql',import.meta.url),'utf8'));
  runtime=postgres({...options,username:'aet_preview_runtime'});holder.sql=runtime;
  for(const[k,v]of Object.entries({APP_ENV:'preview',APP_ORIGIN:'https://aet-test.vercel.app',APPLICATION_DATABASE_MODE:'cloud-preview',APPLICATION_DATABASE_URL:'postgresql://aet_preview_runtime.qrxztgdemfodemlcabcq:test@aws-0-us-west-1.pooler.supabase.com:6543/postgres',APPLICATION_TEST_EMAIL:'synthetic@example.invalid',APPLICATION_CORE_MODE:'six-preview',APPLICATION_CORE_PROVIDER_ACCOUNT:'acct_synthetic',VERCEL:'1',VERCEL_ENV:'preview',VERCEL_GIT_COMMIT_REF:'dev',VERCEL_BRANCH_URL:'aet-test.vercel.app',STAFF_LEGACY_MIGRATION_ENABLED:'false',STAFF_AUTH_CUTOVER_ENABLED:'false'}))vi.stubEnv(k,v);
 },60000);
 afterAll(async()=>{vi.unstubAllEnvs();await runtime?.end();await admin?.end();if(started)execFileSync(join(pg!,'pg_ctl'),['-D',join(dir,'data'),'-m','immediate','-w','stop'],{stdio:'pipe'});if(dir)rmSync(dir,{recursive:true,force:true});});
 it('rejects Production, other branches and privileged roles before activation',async()=>{
  vi.stubEnv('VERCEL_ENV','production');await expect(activateSixTablePreview(runtime)).rejects.toThrow('restricted dev Preview');vi.stubEnv('VERCEL_ENV','preview');
  vi.stubEnv('VERCEL_GIT_COMMIT_REF','main');await expect(activateSixTablePreview(runtime)).rejects.toThrow('restricted dev Preview');vi.stubEnv('VERCEL_GIT_COMMIT_REF','dev');
  await expect(activateSixTablePreview(admin)).rejects.toThrow('restricted database role');expect(()=>convergenceConfiguration(runtime)).toThrow('startup verification');
 });
 it('activates only six private RLS tables and maps all SQL to the shared Preview schema',async()=>{
  await activateSixTablePreview(runtime);expect(convergenceConfiguration(runtime)?.minimal).toBe(true);
  expect(convergedTableName(runtime,'preeval.ai_runs')).toBe('aet_preview_shared.aet_ai_runs');
  for(const name of ['aet_core_applications','aet_education','aet_service_detail','aet_documents','aet_payments','aet_ai_runs'])expect(await runtime`select * from ${coreTable(runtime,name)}`).toHaveLength(0);
  expect(()=>convergedTableName(runtime,'preeval.audit')).toThrow('Retired');
  expect(()=>convergedTableName(runtime,'preeval.rate_limits')).toThrow('Retired');
 });
 it('submits and reads a real application using the restricted Preview role',async()=>{
  const app=await submitConverged({requestId:randomUUID(),email:'synthetic@example.invalid',firstName:'AET Preview',middleName:'',lastName:'Test',country:'US',locale:'en',schoolName:'Synthetic University',countryOfStudy:'US',degreeObtained:'Bachelor',startDate:'2018-09',endDate:'2022-06',uploadsPending:true,terms:true});
  const loaded=await readConverged(app.id,runtime);expect(loaded?.education.school_name).toBe('Synthetic University');expect(loaded?.payment_status).toBe('unpaid');
  expect(await runtime`select id from aet_preview_shared.aet_ai_runs where application_id=${app.id}`).toHaveLength(1);
 });
 it('rejects incomplete schemas or unexpected public grants',async()=>{
  await admin.unsafe('create table aet_preview_shared.unexpected(id int)');await expect(activateSixTablePreview(runtime)).rejects.toThrow('incomplete');await admin.unsafe('drop table aet_preview_shared.unexpected');
  await admin.unsafe('grant select on aet_preview_shared.aet_documents to anon');await expect(activateSixTablePreview(runtime)).rejects.toThrow('grants');await admin.unsafe('revoke select on aet_preview_shared.aet_documents from anon');
 });
});
