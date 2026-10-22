import { legacyTestActor } from "../legacy-test-actor";
// This exercises local APIs with synthetic applicants and signed Stripe fixture events.
// Real Dropbox test uploads and real Stripe TEST checkout creation/expiration are optional.
import assert from 'node:assert/strict';
import { createHash, randomBytes, randomUUID } from 'node:crypto';
import Stripe from 'stripe';
import { db } from '../../lib/preeval/db';
import { configuration, required } from '../../lib/preeval/config';
import { initialData } from '../../lib/evaluation-application/domain';
const admin = legacyTestActor();
const { origin } = configuration(); const sql = db(); const ids: string[] = [];
const digest = (v: string) => createHash('sha256').update(v).digest('hex');
const adminToken = randomBytes(32).toString('base64url'); const adminCookie = 'aet_preeval_session=' + adminToken;
const stripeKey = required('STRIPE_TEST_SECRET_KEY');
if (!/^(sk|rk)_test_/.test(stripeKey)) throw new Error('Test Stripe key required');
const stripe = new Stripe(stripeKey); const eventIds: string[] = [];
const real = process.argv.includes('--services'); let checks = 0;
function check(value: unknown, msg: string) { assert.ok(value, msg); checks++; console.log('PASS ' + msg); }
async function req(path: string, body?: unknown, cookie = '', expected = 200, requestOrigin = origin) {
 const res = await fetch(origin + '/api/evaluation/' + path, { method: body === undefined ? 'GET' : 'POST', headers: { Origin: requestOrigin, Cookie: cookie, ...(body instanceof FormData ? {} : { 'Content-Type': 'application/json' }) }, body: body === undefined ? undefined : body instanceof FormData ? body : JSON.stringify(body) });
 const content = await res.json(); assert.equal(res.status, expected, JSON.stringify({path,content,status:res.status})); checks++;
 return { content, cookie: res.headers.get('set-cookie')?.split(';')[0] || cookie };
}
async function create(custom = false) {
 const data = initialData(); Object.assign(data.client, { name: 'Fictional Workflow Test', email: `workflow-${randomUUID()}@example.test`, country: 'US', street: '123 Fictional Street', city: 'Miami', region: 'FL', postal: '33101', phone: '202-555-0149', office: 'Miami', purpose: 'education' });
 data.evaluee={ title: 'mx', first: 'Fictional', middle: '', last: 'Applicant', birth: '1995-02-28' };
 data.educations=[{ school: 'Fictional University', country: 'CA', degree: 'Bachelor of Science', start: '2013-09', end: '2017-06' }];
 data.services.document.tier='standard'; data.services.translation=custom; data.notes='Disposable formal workflow fixture.'; data.terms=true;
 const res=await fetch(origin+'/api/evaluation/applications',{method:'POST',headers:{Origin:origin,'Content-Type':'application/json','X-Application-Key':randomBytes(32).toString('hex')},body:JSON.stringify({requestId:randomUUID(),locale:'en',data})});
 assert.equal(res.status,201); const {id}=await res.json();ids.push(id);return {id,cookie:res.headers.get('set-cookie')!.split(';')[0],path:'applications/'+id};
}
async function event(session: Record<string, unknown>, type='checkout.session.completed', expected=200, eventId='evt_fixture_'+randomUUID()) {
 eventIds.push(eventId);
 const payload=JSON.stringify({id:eventId,object:'event',type,livemode:false,data:{object:session}});
 const signature=stripe.webhooks.generateTestHeaderString({payload,secret:required('STRIPE_TEST_WEBHOOK_SECRET')});
 const res=await fetch(origin+'/api/evaluation/stripe-webhook',{method:'POST',headers:{'stripe-signature':signature},body:payload});
 assert.equal(res.status,expected,await res.text());checks++;return eventId;
}
async function addFixtureFile(id:string,kind:'document'|'report',version:number) {
 const [file]=await sql`insert into evaluation.files(application_id,kind,name,mime_type,bytes,sha256,dropbox_path,state,input_version) values(${id},${kind},'Synthetic test fixture.pdf','application/pdf',100,${randomUUID()},'/synthetic-not-downloadable','ready',${version}) returning id`;return file.id;
}
async function main(){try{
 await sql`insert into preeval.sessions(hash,application_id,role,email,expires_at) values(${digest(adminToken)},null,'admin',${admin},now()+interval '1 hour')`;
 const a=await create(true), b=await create();
 await req('stripe-webhook',{},'',400);
 await req('admin/applications',undefined,a.cookie,401); await req(a.path+'/admin',undefined,a.cookie,401);
 const list=(await req('admin/applications?q=Fictional%20Workflow',undefined,adminCookie)).content;check(list.rows.some((r:{id:string})=>r.id===a.id),'staff queue lists formal applications');
 await req(a.path+'/staff',{action:'notes',version:1,notes:'private'},a.cookie,401);
 await req(a.path+'/checkout',{},a.cookie,409);
 await req(a.path+'/staff',{action:'quote',version:1,base:10999,additional:5000,explanation:'Incorrect base'},adminCookie,400);
 await req(a.path+'/staff',{action:'quote',version:1,base:11000,additional:5000,explanation:'Synthetic translation quote'},adminCookie);
 await req(a.path+'/staff',{action:'notes',version:1,notes:'stale'},adminCookie,409);
 await req(a.path+'/staff',{action:'notes',version:2,notes:'PRIVATE INTERNAL NOTE'},adminCookie);
 let app=(await req(a.path,undefined,a.cookie)).content;check(app.total===16000&&!('staff_notes' in app)&&!('audit' in app),'customer sees approved quote without staff-only data');
 await req(a.path+'/staff',{action:'status',version:app.version,status:'processing',message:''},adminCookie,409);
 await req(a.path+'/staff',{action:'status',version:app.version,status:'needs_information',message:'Please upload a transcript.'},adminCookie);
 app=(await req(a.path,undefined,a.cookie)).content;check(app.customer_message==='Please upload a transcript.','information requests appear on customer status');
 const bad=new FormData();bad.set('file',new Blob(['not a PDF'],{type:'application/pdf'}),'bad.pdf');await req(a.path+'/files',bad,a.cookie,400);
 await req(a.path+'/reports',bad,a.cookie,401);
 await req(a.path+'/cancel',{},a.cookie,403,'https://untrusted.example');
 const doc=await addFixtureFile(a.id,'document',0);const report=await addFixtureFile(a.id,'report',app.input_version);
 app=(await req(a.path,undefined,a.cookie)).content;check(app.files.length===1&&!app.released_file_id,'unreleased reports remain private');
 await req(a.path+'/files/'+report,undefined,a.cookie,403);await req(a.path+'/files/'+doc,undefined,b.cookie,401);
 await req(a.path+'/staff',{action:'release',version:app.version,fileId:report},adminCookie,409);
 const sessionId='cs_test_fixture_'+randomUUID();const intent='pi_fixture_'+randomUUID();
 await sql`insert into evaluation.payments(application_id,session_id,amount_cents,status) values(${a.id},${sessionId},16000,'open')`;
 const session={id:sessionId,object:'checkout.session',livemode:false,metadata:{pilot:'aet-formal-2026-local',applicationId:a.id},client_reference_id:a.id,currency:'usd',amount_total:16000,payment_status:'paid',status:'complete',payment_intent:intent};
 await event({...session,amount_total:1},undefined,400);await event({...session,currency:'eur'},undefined,400);let eventId=await event(session);await event(session,undefined,200,eventId);
 app=(await req(a.path,undefined,a.cookie)).content;check(app.payment_status==='paid','signed matching test event records payment');
 const [count]=await sql`select count(*)::int as n from evaluation.payment_events where id=${eventId}`;check(count.n===1,'duplicate payment events are idempotent');
 await req(a.path+'/staff',{action:'quote',version:app.version,base:11000,additional:6000,explanation:'Locked'},adminCookie,409);
 await req(a.path+'/staff',{action:'status',version:app.version,status:'processing',message:''},adminCookie);
 app=(await req(a.path,undefined,a.cookie)).content;
 await sql`update evaluation.applications set input_version=input_version+1 where id=${a.id}`;
 await req(a.path+'/staff',{action:'release',version:app.version,fileId:report},adminCookie,409);
 const updatedReport=await addFixtureFile(a.id,'report',app.input_version+1);
 const pendingDoc=await addFixtureFile(a.id,'document',0);await sql`update evaluation.files set state='uploading' where id=${pendingDoc}`;
 await req(a.path+'/staff',{action:'release',version:app.version,fileId:updatedReport},adminCookie,409);
 await sql`delete from evaluation.files where id=${pendingDoc}`;
 await req(a.path+'/staff',{action:'release',version:app.version,fileId:updatedReport},adminCookie);
 app=(await req(a.path,undefined,a.cookie)).content;check(app.status==='completed'&&app.files.filter((f:{kind:string})=>f.kind==='report').length===1&&app.released_file_id===updatedReport,'only the current released report becomes visible');
 await event({object:'charge',id:'ch_fixture',payment_intent:intent,currency:'usd',amount:16000,amount_refunded:1000},'charge.refunded');
 app=(await req(a.path,undefined,a.cookie)).content;check(app.payment_status==='partially_refunded'&&!app.released_file_id,'refund revokes report delivery');
 await event(session);app=(await req(a.path,undefined,a.cookie)).content;check(app.payment_status==='partially_refunded','late payment event cannot undo a refund');
 await req(a.path+'/cancel',{},a.cookie,409);
 const oldLink=(await req(a.path+'/access-link',{},adminCookie)).content.url;
 const newLink=(await req(a.path+'/access-link',{},adminCookie)).content.url;
 const token=(url:string)=>new URLSearchParams(new URL(url).hash.slice(1)).get('token');
 await req('access/consume',{token:token(oldLink)},'',400);
 const renewed=await req('access/consume',{token:token(newLink)});
 await req('access/consume',{token:token(newLink)},'',400);
 await sql`update evaluation.applications set created_at=now()-interval '25 hours' where id=${a.id}`;
 await req(a.path,undefined,a.cookie,401);await req(a.path,undefined,renewed.cookie);
 await sql`update evaluation.sessions set expires_at=now()-interval '1 second' where application_id=${a.id}`;
 await req(a.path,undefined,renewed.cookie,401);
 check(true,'access links are replaced, single-use and time-bounded');
 if(real){
  const files=new FormData();files.set('file',new Blob([Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jM1sAAAAASUVORK5CYII=','base64')],{type:'image/png'}),'Synthetic one-pixel test.png');
  await req(b.path+'/files',files,b.cookie);await req(b.path+'/files',files,b.cookie);
  const saved=(await req(b.path,undefined,b.cookie)).content;check(saved.files.length===1,'real Dropbox test upload deduplicates retries');
  const download=await fetch(origin+'/api/evaluation/'+b.path+'/files/'+saved.files[0].id,{headers:{Cookie:b.cookie}});check(download.ok&&(await download.arrayBuffer()).byteLength===68,'private Dropbox download round-trips bytes');
  const first=(await req(b.path+'/checkout',{},b.cookie)).content;const second=(await req(b.path+'/checkout',{},b.cookie)).content;check(first.url===second.url&&first.url.startsWith('https://checkout.stripe.com/'),'real test checkout reuses its open session');
  const [payment]=await sql`select session_id,amount_cents from evaluation.payments where application_id=${b.id}`;
  const checkout=await stripe.checkout.sessions.retrieve(payment.session_id);check(!checkout.livemode&&checkout.amount_total===11000,'Stripe test checkout matches website total exactly');
  await req(b.path+'/cancel',{},b.cookie);check((await stripe.checkout.sessions.retrieve(payment.session_id)).status==='expired','cancellation expires an open Stripe checkout');
 }else await req(b.path+'/cancel',{},b.cookie);
 await req(b.path+'/checkout',{},b.cookie,409);await req(b.path+'/staff',{action:'notes',version:1,notes:'closed'},adminCookie,409);
 console.log(`${checks} workflow checks passed${real?' with real isolated Dropbox uploads and Stripe test checkout':' (synthetic payment fixtures)'}.`);
}finally{
 // Remove only this run's private local fixtures. Dropbox synthetic test uploads remain in the isolated test directory.
 for(const id of ids) await sql`delete from evaluation.applications where id=${id} and data->>'notes'='Disposable formal workflow fixture.'`;
 for (const id of ids.filter(Boolean)) await sql`delete from public.fce_applications where id=${id}`;
 await sql`delete from preeval.sessions where hash=${digest(adminToken)}`;
 for (const eventId of eventIds) await sql`delete from evaluation.payment_events where id=${eventId}`;
 await sql.end();
}}
main().catch(e=>{console.error(e);process.exitCode=1;});
