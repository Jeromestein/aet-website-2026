import { coreTable } from './connection';
import 'server-only';
import { randomUUID } from 'node:crypto';
import { db, type Row } from '../preeval/db';
import { AppError } from '../preeval/domain';
import { configuration, required } from '../preeval/config';
import { deliveryHash, EmailReviewRequired, type EmailTransport } from '../email/delivery';
const kinds=['confirmation','result','information','access'];
export async function enqueueCompact(input:{applicationId?:string|null;kind:string;key:string;resultVersion?:number;informationRequestId?:number|string}) {
  if(!input.applicationId||!kinds.includes(input.kind))throw new Error('Scoped notification required');
  await db().begin(async tx=>{
    const [s]=await tx`select id,notification_state,result_version from ${coreTable(tx,'aet_service_detail')}
      where application_id=${input.applicationId!} and service_type='pre-evaluation' for update`;
    if(!s)throw new Error('Service missing');
    const state=s.notification_state,old=state[input.kind];
    if(old?.key===input.key)return;
    if(input.kind==='result'&&input.resultVersion!==s.result_version)throw new EmailReviewRequired('result_superseded_or_withheld');
    // At most four current entries. Never overwrite an uncertain send with a new
    // event; reconciliation must resolve it first. No ever-growing history array.
    if(old&&old.state!=='sent'&&(old.attempts>0||old.state==='sending'))throw new EmailReviewRequired('previous_notification_unsettled');
    state[input.kind]={id:randomUUID(),kind:input.kind,key:input.key,recipient:configuration().recipient,
      result_version:input.resultVersion??null,information_request_id:input.informationRequestId??null,
      state:'queued',attempts:0,provider_id:null,payload_hash:null,first_attempt_at:null,
      created_at:new Date().toISOString(),available_at:new Date().toISOString(),lease:null,locked_at:null};
    await tx`update ${coreTable(tx,'aet_service_detail')} set notification_state=${tx.json(state)} where id=${s.id}`;
  });
}
export async function compactNotificationRows(id:string) {
  const [s]=await db()`select notification_state from ${coreTable(db(),'aet_service_detail')} where application_id=${id} and service_type='pre-evaluation'`;
  return Object.values(s?.notification_state||{}) as Row[];
}
export async function retryCompactNotification(id:string,emailId:string) {
  await db().begin(async tx=>{
    const [s]=await tx`select id,notification_state from ${coreTable(tx,'aet_service_detail')} where application_id=${id} and service_type='pre-evaluation' for update`;
    const n=s&&Object.values(s.notification_state).find((n:any)=>n.id===emailId) as Row|undefined;
    if(!n||n.state!=='failed'||n.provider_id||n.available_at===null||n.error?.endsWith('_review'))throw new AppError('email_retry_unavailable',409);
    // Preserve receipt, idempotency key, first-attempt time and attempt budget.
    n.available_at=new Date().toISOString();
    await tx`update ${coreTable(tx,'aet_service_detail')} set notification_state=${tx.json(s.notification_state)} where id=${s.id}`;
  });
}
export async function flushCompactNotifications(transport:EmailTransport,applicationId?:string,options?:{serviceType:string;kinds:string[];render:(row:Row)=>Promise<{subject:string;html:string;cc?:string[]}>}) {
  const outcome={attempted:0,sent:0,reviewRequired:0};
  // No unbounded scan/cron. Existing entry points request one application.
  if(!applicationId)return outcome;
  for(const kind of options?.kinds||kinds){
    const lease=randomUUID();
    const claimed=await db().begin(async tx=>{
      const [s]=await tx`select id,notification_state from ${coreTable(tx,'aet_service_detail')} where application_id=${applicationId!} and service_type=${options?.serviceType||'pre-evaluation'} for update`;
      const n=s?.notification_state[kind];
      if(!n||n.state==='sent'||n.recipient!==configuration().recipient||n.available_at===null)return null;
      const now=Date.now(),first=n.first_attempt_at?new Date(n.first_attempt_at).getTime():null;
      if(n.state==='sending'&&now-new Date(n.locked_at).getTime()<180000)return null;
      if(n.attempts>=5||(first!==null&&now-first>=23*3600000)){
        Object.assign(n,{state:'failed',error:'delivery_window_or_attempts_review',available_at:null,lease:null,locked_at:null});
        await tx`update ${coreTable(tx,'aet_service_detail')} set notification_state=${tx.json(s.notification_state)} where id=${s.id}`;
        outcome.reviewRequired++;return null;
      }
      if(new Date(n.available_at).getTime()>now)return null;
      Object.assign(n,{state:'sending',lease,locked_at:new Date(now).toISOString(),attempts:n.attempts+1,
        first_attempt_at:n.first_attempt_at||new Date(now).toISOString()});
      await tx`update ${coreTable(tx,'aet_service_detail')} set notification_state=${tx.json(s.notification_state)} where id=${s.id}`;
      return {...n,application_id:applicationId};
    });
    if(!claimed)continue;
    async function change(fn:(n:Row)=>void){
      return db().begin(async tx=>{
        const [s]=await tx`select id,notification_state from ${coreTable(tx,'aet_service_detail')} where application_id=${applicationId!} and service_type=${options?.serviceType||'pre-evaluation'} for update`;
        const n=s?.notification_state[kind];if(!n||n.id!==claimed!.id||n.lease!==lease||n.state!=='sending')return false;
        fn(n);await tx`update ${coreTable(tx,'aet_service_detail')} set notification_state=${tx.json(s.notification_state)} where id=${s.id}`;return true;
      });
    }
    try{
      const {renderQueuedEmail}=await import('../preeval/email');
      const content=options?await options.render(claimed):await renderQueuedEmail(claimed);
      const mail={id:claimed.id,recipient:claimed.recipient,from:`${required('RESEND_DEFAULT_FROM_NAME')} <${required('RESEND_DEFAULT_FROM_ADDRESS')}>`,...content};
      const payload=deliveryHash(mail,claimed.payload_hash);
      const valid=await change(n=>{
        if(Date.now()-new Date(n.locked_at).getTime()>=180000||Date.now()-new Date(n.first_attempt_at).getTime()>=23*3600000)
          throw new EmailReviewRequired('delivery_window_expired_review');
        n.payload_hash=payload;n.locked_at=new Date().toISOString();
      });
      if(!valid)continue;
      outcome.attempted++;
      const providerId=await transport(mail);
      if(await change(n=>Object.assign(n,{state:'sent',provider_id:providerId,sent_at:new Date().toISOString(),error:null,lease:null,locked_at:null})))outcome.sent++;
    }catch(e){
      const review=e instanceof EmailReviewRequired||claimed.attempts>=5;
      await change(n=>Object.assign(n,{state:'failed',error:e instanceof EmailReviewRequired?e.message:'delivery_failed',
        available_at:review?null:new Date(Date.now()+60000).toISOString(),lease:null,locked_at:null}));
      if(review)outcome.reviewRequired++;
    }
  }
  return outcome;
}
