import { coreTable } from './connection';
import 'server-only';
import type Stripe from 'stripe';
import type { TransactionSql } from 'postgres';
import { db,type Row } from '../preeval/db';
import { configuration } from '../preeval/config';
import { AppError } from '../preeval/domain';
import { stripeClient } from '../preeval/payments';
import { providerAccount } from './converged-store';
import { readFormal, touchFormal, queueFormalNotification } from './formal-store';
const intentId=(value:string|{id:string}|null)=>typeof value==='string'?value:value?.id;
const client=()=>stripeClient('pre-evaluation');
const account=()=>providerAccount();
async function recordRefund(tx:TransactionSql,p:Row,intent:string,amount:number) {
  const refunded=Math.max(p.refunded_cents,amount);
  const status=refunded>=p.amount_cents?'refunded':'partially_refunded';
  if(p.refunded_cents===refunded && p.payment_status===status && p.payment_intent_id===intent)return;
  await tx`update ${coreTable(tx,'aet_payments')} set payment_status=${status},payment_intent_id=${intent},refunded_cents=${refunded},updated_at=now() where id=${p.id}`;
  await tx`update ${coreTable(tx,'aet_service_detail')} set result=case when result is null then null else
    jsonb_set(jsonb_set(result,'{status}','"draft"'::jsonb),'{released_at}','null'::jsonb) end,updated_at=now()
    where application_id=${p.application_id} and service_type='evaluation'`;
  const a=await readFormal(p.application_id,tx);
  if(a?.status==='completed')await touchFormal(tx,p.application_id,'reviewing');
}
function validateCharge(c:Stripe.Charge,intent:string,p:Row) {
  if(c.livemode || intentId(c.payment_intent)!==intent || c.currency!=='usd' || c.amount!==p.amount_cents ||
    !Number.isSafeInteger(c.amount_refunded) || c.amount_refunded<0 || c.amount_refunded>p.amount_cents)throw new AppError('invalid_payment');
}
export async function checkoutFormalCore(id:string) {
  return db().begin(async tx=>{
    const a=await readFormal(id,tx,true);if(!a)throw new AppError('not_found',404);
    if(a.payment_status==='waived')throw new AppError('payment_not_required',409);
    if(a.status==='cancelled')throw new AppError('application_cancelled',409);
    if(['paid','partially_refunded','refunded'].includes(a.payment_status))throw new AppError('already_paid',409);
    if(!Number.isSafeInteger(a.amount_cents)||a.amount_cents<=0)throw new AppError('quote_required',409);
    let [p]=await tx`select * from ${coreTable(tx,'aet_payments')} where application_id=${id} and payment_status in ('creating','open') for update`;
    if(p?.checkout_session_id){
      const old=await client().checkout.sessions.retrieve(p.checkout_session_id);
      if(old.status==='open')return old.url!;
      if(old.payment_status==='paid')throw new AppError('payment_reconciliation_required',409);
      await tx`update ${coreTable(tx,'aet_payments')} set payment_status='expired',updated_at=now() where id=${p.id}`;p=undefined!;
    }
    if(!p)[p]=await tx`insert into ${coreTable(tx,'aet_payments')}(application_id,amount_cents,payment_status,provider,provider_account,provider_mode,source)
      values (${id},${a.amount_cents},'creating','stripe',${account()},'test','formal-evaluation') returning *`;
    const session=await client().checkout.sessions.create({mode:'payment',allowed_payment_method_types:['card','alipay'],
      line_items:[{price_data:{currency:'usd',product_data:{name:'Formal Credential Evaluation',description:'Evaluation services and delivery shown on your application.'},unit_amount:p.amount_cents},quantity:1}],
      client_reference_id:id,customer_email:configuration().recipient,
      metadata:{applicationId:id,paymentType:'formal-evaluation',pilot:'aet-formal-2026-local'},
      success_url:configuration().origin+('/credential-evaluation-application/success?id='+id)+'&checkout=success',cancel_url:configuration().origin+('/credential-evaluation-application/success?id='+id)+'&checkout=cancelled',
      expires_at:Math.floor(Date.now()/1000)+1800},{idempotencyKey:'formal-checkout-'+p.id});
    await tx`update ${coreTable(tx,'aet_payments')} set checkout_session_id=${session.id},payment_status='open',updated_at=now() where id=${p.id}`;
    return session.url!;
  });
}
export async function applyFormalCheckout(s:Stripe.Checkout.Session,eventId:string,eventType:string) {
  if(s.livemode || s.metadata?.pilot!=='aet-formal-2026-local')return;
  const id=s.metadata?.applicationId;if(!id)throw new AppError('invalid_payment');
  await db().begin(async tx=>{
    const a=await readFormal(id,tx,true);
    const [p]=await tx`select * from ${coreTable(tx,'aet_payments')} where application_id=${id} and checkout_session_id=${s.id}
      and provider='stripe' and provider_account=${account()} and provider_mode='test' and source='formal-evaluation' for update`;
    if(!p)throw new AppError('unknown_payment',409);
    if(s.client_reference_id!==id || s.currency!=='usd' || s.amount_total!==p.amount_cents || p.amount_cents!==a.amount_cents)throw new AppError('invalid_payment');
    let refunded=p.refunded_cents>0;const intent=intentId(s.payment_intent);
    // Reconcile provider state even for a repeated event: a paid Session can later be refunded.
    if(s.payment_status==='paid'){
      if(!intent || (p.payment_intent_id && p.payment_intent_id!==intent))throw new AppError('invalid_payment');
      const current=await client().paymentIntents.retrieve(intent,{expand:['latest_charge']});
      if(current.id!==intent || current.livemode || current.status!=='succeeded' || current.currency!=='usd' || current.amount!==p.amount_cents || !current.latest_charge || typeof current.latest_charge==='string')throw new AppError('invalid_payment');
      validateCharge(current.latest_charge,intent,p);
      refunded=refunded||current.latest_charge.amount_refunded>0;
      if(refunded)await recordRefund(tx,p,intent,current.latest_charge.amount_refunded);
    }
    const stateOnly=true;
    if(refunded)return;
    // The application/payment locks serialize simultaneous deliveries. Only an
    // effective state change updates timestamps or writes business audit history.
    let changed: Row[]=[];
    if(s.payment_status==='paid' && !['refunded','partially_refunded'].includes(p.payment_status))
      changed=await tx`update ${coreTable(tx,'aet_payments')} set payment_status='paid',payment_intent_id=${intent!},paid_at=coalesce(paid_at,now()),updated_at=now() where id=${p.id}
        and (payment_status is distinct from 'paid' or payment_intent_id is distinct from ${intent!} or paid_at is null) returning id`;
    else if((s.status==='expired'||eventType==='checkout.session.async_payment_failed')&&!['paid','refunded','partially_refunded'].includes(p.payment_status))
      changed=await tx`update ${coreTable(tx,'aet_payments')} set payment_status='expired',updated_at=now() where id=${p.id}
        and (${!stateOnly} or payment_status is distinct from 'expired') returning id`;
    if(changed.length){await touchFormal(tx,id);if(s.payment_status==='paid')await queueFormalNotification(tx,id,'payment','payment:'+p.id,{payment_id:p.id});}
  });
}
export async function refundFormalCore(event:Stripe.Event) {
  const c=event.data.object as Stripe.Charge,intent=intentId(c.payment_intent);
  if(!intent)throw new AppError('unresolved_refund',409);
  let [p]=await db()`select * from ${coreTable(db(),'aet_payments')} where payment_intent_id=${intent} and provider_account=${account()} and provider_mode='test' and source='formal-evaluation'`;
  if(!p){
    const sessions=await client().checkout.sessions.list({payment_intent:intent,limit:2});
    if(sessions.has_more||sessions.data.length!==1)throw new AppError('unresolved_refund',409);
    const s=sessions.data[0];
    if(s.livemode||intentId(s.payment_intent)!==intent)throw new AppError('invalid_payment');
    if(s.metadata?.pilot!=='aet-formal-2026-local')return;
    if(!s.metadata.applicationId || s.client_reference_id!==s.metadata.applicationId || s.mode!=='payment' || s.currency!==c.currency || s.amount_total!==c.amount)throw new AppError('invalid_payment');
    [p]=await db()`select * from ${coreTable(db(),'aet_payments')} where application_id=${s.metadata.applicationId} and checkout_session_id=${s.id} and provider_account=${account()} and provider_mode='test' and source='formal-evaluation'`;
    if(!p)throw new AppError('unresolved_refund',409);
  }
  await db().begin(async tx=>{
    await readFormal(p.application_id,tx,true);
    const [locked]=await tx`select * from ${coreTable(tx,'aet_payments')} where id=${p.id} for update`;
    if(locked.payment_intent_id && locked.payment_intent_id!==intent)throw new AppError('invalid_payment');
    validateCharge(c,intent,locked);if(!c.amount_refunded)throw new AppError('invalid_payment');
    await recordRefund(tx,locked,intent,c.amount_refunded);
  });
}
export async function reconcileFormalCore(id:string) {
  const rows=await db()`select checkout_session_id from ${coreTable(db(),'aet_payments')} where application_id=${id} and payment_status in ('open','paid','partially_refunded') order by created_at desc limit 3`;
  for(const p of rows){const s=await client().checkout.sessions.retrieve(p.checkout_session_id);await applyFormalCheckout(s,`reconcile:${s.id}:${s.status}:${s.payment_status}`,'checkout.reconciled');}
}
export async function cancelFormalCore(id:string,actor:string) {
  const paid=await db().begin(async tx=>{
    const a=await readFormal(id,tx,true);if(!a)throw new AppError('not_found',404);
    if(['paid','partially_refunded','refunded'].includes(a.payment_status))throw new AppError('contact_for_cancellation',409);
    if(a.status==='cancelled')return null;
    for(const p of await tx`select * from ${coreTable(tx,'aet_payments')} where application_id=${id} and payment_status='open'`){
      const s=await client().checkout.sessions.retrieve(p.checkout_session_id);
      if(s.payment_status==='paid')return s;
      if(s.status==='open')await client().checkout.sessions.expire(s.id);
      await tx`update ${coreTable(tx,'aet_payments')} set payment_status='expired',updated_at=now() where id=${p.id}`;
    }
    await touchFormal(tx,id,'cancelled');return null;
  });
  if(paid){await applyFormalCheckout(paid,`cancel-check:${paid.id}`,'checkout.reconciled');throw new AppError('contact_for_cancellation',409);}
}
