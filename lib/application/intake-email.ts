import 'server-only';
import { randomUUID } from 'node:crypto';
import { db, table } from '../preeval/db';
import { required } from '../preeval/config';
import { requireIntakePreview } from './intake-server';
import { TEST_RECIPIENT } from './intake';
type Mail={id:string;recipient:string;subject:string;html:string};
export type IntakeTransport=(mail:Mail)=>Promise<string>;
const resendTransport:IntakeTransport=async mail=>{
  const response=await fetch('https://api.resend.com/emails',{method:'POST',headers:{Authorization:`Bearer ${required('RESEND_API_KEY')}`,'Content-Type':'application/json','Idempotency-Key':mail.id},
    body:JSON.stringify({from:`${required('RESEND_DEFAULT_FROM_NAME')} <${required('RESEND_DEFAULT_FROM_ADDRESS')}>`,to:[TEST_RECIPIENT],subject:mail.subject,html:mail.html}),signal:AbortSignal.timeout(15000)});
  const body=await response.json();
  if(!response.ok||typeof body.id!=='string') throw new Error('delivery_failed');
  return body.id;
};
/** Process one immutable confirmation only. Never drain unrelated pre-evaluation mail. */
export async function sendIntakeEmail(applicationId:string,transport:IntakeTransport=resendTransport) {
  requireIntakePreview();const sql=db(),lease=randomUUID();
  const [row]=await sql`update ${table('evaluation.intake_emails')} set state='sending',lease=${lease},locked_at=now(),attempts=attempts+1,first_attempt_at=coalesce(first_attempt_at,now())
    where application_id=${applicationId} and recipient=${TEST_RECIPIENT} and available_at<=now()
    and (state in ('queued','failed') or (state='sending' and locked_at<now()-interval '3 minutes'))
    and (first_attempt_at is null or first_attempt_at>now()-interval '23 hours') returning id,recipient,subject,html`;
  if(!row)return;
  try{
    const providerId=await transport(row as Mail);
    await sql`update ${table('evaluation.intake_emails')} set state='sent',provider_id=${providerId},sent_at=now(),error=null,lease=null,locked_at=null where application_id=${applicationId} and lease=${lease}`;
  }catch{
    await sql`update ${table('evaluation.intake_emails')} set state='failed',error='delivery_failed',available_at=now()+interval '60 seconds',lease=null,locked_at=null where application_id=${applicationId} and lease=${lease}`;
  }
}
