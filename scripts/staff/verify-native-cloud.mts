import assert from 'node:assert/strict';
import { createHash,randomBytes,randomUUID } from 'node:crypto';
import { readFile,writeFile,unlink } from 'node:fs/promises';
import { staffDb } from '../../lib/staff/db';
import { staffAdmin } from '../../lib/staff/client';
import { prepareStaffIdentity } from '../../lib/staff/migrate';
const sql=staffDb(),admin=staffAdmin(),origin='http://localhost:3022';
assert.equal(process.env.STAFF_LEGACY_MIGRATION_ENABLED,'false');
assert.equal(process.env.STAFF_AUTH_CUTOVER_ENABLED,'false');
assert.equal(process.env.STAFF_AUTH_SYNTHETIC_TEST,'true');
const manifest='/private/tmp/aet-native-fixture.json';
const cleanupOnly=process.argv.includes('--cleanup'),keep=process.argv.includes('--keep-for-browser');
const digest=(value:unknown)=>createHash('sha256').update(JSON.stringify(value)).digest('hex');
const legacy=async()=>digest(await sql`select s.*,u.hash,u.salt,u.lock_until from aet_private.staff_accounts s join public.users u on u.id=s.legacy_user_id order by s.legacy_user_id`);
const users=async()=>digest(await sql`select * from public.users order by id`);
type State={email:string;password:string;authId?:string;staffId?:string;legacy:string;users:string;checks:number};
if(!cleanupOnly)assert.equal(await readFile(manifest).then(()=>true,()=>false),false,'Clean previous native fixtures first');
const state:State=cleanupOnly?JSON.parse(await readFile(manifest,'utf8')):{email:`aet-native-${randomUUID()}@example.invalid`,password:randomBytes(32).toString('hex')+'Aa!',legacy:await legacy(),users:await users(),checks:0};
const persist=()=>writeFile(manifest,JSON.stringify(state),{mode:0o600});
function check(value:unknown,message:string){assert.ok(value,message);state.checks++;console.log('PASS '+message);}
let cookie='';
async function post(action:string,body:unknown,status=200){const response=await fetch(origin+'/api/staff-auth/'+action,{method:'POST',headers:{Origin:origin,'Content-Type':'application/json',Cookie:cookie},body:JSON.stringify(body),signal:AbortSignal.timeout(30000)});assert.equal(response.status,status,action+' HTTP status');state.checks++;const set=response.headers.getSetCookie();if(set.length)cookie=set.map(v=>v.split(';')[0]).join('; ');return response.json();}
async function cleanup(){
 if(state.staffId)await sql`delete from aet_private.password_recovery where staff_id=${state.staffId}`;
 if(state.authId){await sql`delete from aet_private.staff_accounts where auth_user_id=${state.authId} and email=${state.email} and legacy_user_id is null`;assert.equal((await admin.auth.admin.deleteUser(state.authId)).error,null);}
 const key=createHash('sha256').update('login:email:'+state.email).digest('hex');await sql`delete from aet_private.auth_attempts where key=${key}`;
 check(await legacy()===state.legacy,'Original employee credentials and office scopes unchanged');
 check(await users()===state.users,'Complete legacy user table unchanged');
 check((await sql`select id from auth.users where email=${state.email}`).length===0,'Temporary native identity removed');
 await unlink(manifest).catch(()=>{});
}
let succeeded=false;
try {
 if(cleanupOnly){await cleanup();succeeded=true;}
 else {
  await persist();
  const created=await admin.auth.admin.createUser({email:state.email,password:state.password,email_confirm:true,app_metadata:{aet_native_test:true}});
  assert.equal(created.error,null);state.authId=created.data.user!.id;await persist();
  await post('login',{email:state.email,password:state.password},401);
  check(true,'An Auth identity without staff membership cannot sign in');
  const [staff]=await sql`insert into aet_private.staff_accounts(legacy_user_id,email,auth_user_id,migration_state,role,offices,include_unassigned) values(null,${state.email},${state.authId},'complete','admin',ARRAY['Boston','New York','Miami','San Francisco','Los Angeles'],true) returning migration_id`;
  state.staffId=staff.migration_id;await persist();
  check(await prepareStaffIdentity(state.email,state.password)==='ready','Native identity bypasses disabled legacy migration');
  await post('login',{email:state.email,password:'incorrect'},401);
  const login=await post('login',{email:state.email,password:state.password});
  check(login.url==='/admin/CRM'&&cookie.includes('aet_staff_auth'),'Native password login creates dashboard session');
  const workspace=await fetch(origin+'/api/staff-workspace',{headers:{Cookie:cookie}});assert.equal(workspace.status,200);const view=await workspace.json();
  check(view.staff.offices.length===5&&view.staff.includeUnassigned,'Native administrator sees all permitted office options');
  const page=await fetch(origin+'/admin/CRM',{headers:{Cookie:cookie},redirect:'manual'});
  check(page.status===200&&(await page.text()).includes('AET Workspace'),'Original dashboard renders for independent administrator');
  await post('forgot-password',{email:state.email},404);
  await post('reset-password',{token:'a'.repeat(64),password:state.password},404);
  await post('logout',{});
  await post('login',{email:state.email,password:state.password});
  await sql`update aet_private.staff_accounts set active=false where migration_id=${state.staffId}`;
  check((await fetch(origin+'/api/staff-workspace',{headers:{Cookie:cookie}})).status===401,'Deactivation immediately removes dashboard access');
  await post('login',{email:state.email,password:state.password},401);
  await sql`update aet_private.staff_accounts set active=true where migration_id=${state.staffId}`;
  check(await legacy()===state.legacy&&await users()===state.users,'All native authentication operations leave old employees untouched');
  const grant=await sql`select has_table_privilege('anon','aet_private.staff_accounts','SELECT') or has_table_privilege('authenticated','aet_private.staff_accounts','SELECT') as exposed`;
  check(!grant[0].exposed,'Private authorization remains unavailable to browser database roles');
  await persist();succeeded=true;
 }
}catch(e){console.error(e instanceof assert.AssertionError?e.message:'Native acceptance failed; credentials omitted.');process.exitCode=1;}
finally {try{if(!cleanupOnly&&(!keep||!succeeded))await cleanup();}finally{await sql.end();}}
console.log(`${state.checks} native staff checks passed. ${succeeded&&keep&&!cleanupOnly?'Temporary native fixture retained for browser verification.':'Temporary fixture removed.'}`);
