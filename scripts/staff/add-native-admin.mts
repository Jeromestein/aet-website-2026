import assert from 'node:assert/strict';
import { z } from 'zod';
import { staffDb } from '../../lib/staff/db';
import { normalizeEmail } from '../../lib/staff/password';

// Run only after the owner creates the Auth identity and sets its password.
// This administrative command never creates a legacy user or sends mail.
const email=z.email().parse(normalizeEmail(process.argv[2] || ''));
const apply=process.argv.includes('--apply');
const offices=['Boston','New York','Miami','San Francisco','Los Angeles'];
const sql=staffDb();
try {
 await sql.begin(async tx=>{
  const identities=await tx`select id,email_confirmed_at,(encrypted_password is not null and encrypted_password<>'') as has_password from auth.users where lower(email)=${email}`;
  assert.equal(identities.length,1,'Create exactly one matching Supabase Auth user first');
  const identity=identities[0];
  assert.ok(identity.email_confirmed_at && identity.has_password,'Confirm the new account and set its password first');
  assert.equal((await tx`select id from public.users where lower(email)=${email}`).length,0,'This command cannot provision or migrate legacy users');
  const [existing]=await tx`select * from aet_private.staff_accounts where email=${email} or auth_user_id=${identity.id} for update`;
  if(existing){
   assert.equal(existing.email,email); assert.equal(existing.auth_user_id,identity.id); assert.equal(existing.legacy_user_id,null);
   assert.equal(existing.role,'admin'); assert.equal(existing.active,true); assert.equal(existing.include_unassigned,true);
   assert.deepEqual([...existing.offices].sort(),[...offices].sort());
   console.log('The requested independent administrator is already configured.');return;
  }
  if(!apply){console.log('Ready: confirmed independent Auth identity; administrator for all five offices and unassigned records. Use --apply to save.');return;}
  await tx`insert into aet_private.staff_accounts(legacy_user_id,email,auth_user_id,migration_state,role,offices,include_unassigned) values(null,${email},${identity.id},'complete','admin',${offices},true)`;
  console.log('Independent administrator configured for all five offices and unassigned records. No legacy users or passwords changed; no email sent.');
 });
}catch(e){console.error(e instanceof assert.AssertionError?e.message:'Administrator provisioning failed; sensitive details omitted.');process.exitCode=1;}finally{await sql.end();}
