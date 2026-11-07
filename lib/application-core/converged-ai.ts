import 'server-only';
import { randomUUID } from 'node:crypto';
import { db,type Row } from '../preeval/db';
import { AIError,digest,PROMPT_VERSION } from '../preeval/ai-contract';
import { manifestHash } from '../preeval/ai-documents';
import type { AIDependencies } from '../preeval/ai';
import { readConverged,dueConverged,saveResult,setStatus } from './converged-store';

export async function processConvergedAI(id:string|undefined,deps:AIDependencies) {
  const {model}=deps.configured();
  const lease=randomUUID();
  const app: Row | null=await db().begin(async tx=>{
    const candidate=(await dueConverged(1,id))[0];
    if(!candidate)return null;
    // All input/payment/staff mutations take the same application lock first.
    const a=await readConverged(candidate,tx,true);
    if(!a || a.uploads_pending || ['cancelled','needs_information'].includes(a.status))return null;
    const [job]=await tx`update aet.aet_ai_runs set state='running',lease=${lease},locked_at=now(),attempts=attempts+1,
      model=${model},prompt_version=${PROMPT_VERSION},error=null where id=${a.job_id} and current and attempts<3
      and ((state='queued' and available_at<=now()) or (state='running' and locked_at<now()-interval '8 minutes')) returning *`;
    if(!job){
      await tx`update aet.aet_ai_runs set state='failed',error='ai_interrupted',lease=null,locked_at=null
        where id=${a.job_id} and current and state='running' and attempts>=3 and locked_at<now()-interval '8 minutes'`;
      return null;
    }
    await setStatus(tx,a.id,'processing');return {...a,ai_attempts:job.attempts};
  });
  if(!app)return false;
  const heartbeat=setInterval(()=>{void db()`update aet.aet_ai_runs set locked_at=now()
    where id=${app.job_id} and current and lease=${lease} and state='running'`.catch(()=>{});},30000);
  heartbeat.unref();let saved=false;
  try {
    const academic=(a:Row)=>({school:a.education.school_name,country:a.education.country_of_study,
      degree:a.education.degree_obtained,start:a.education.start_date,end:a.education.end_date});
    const input=academic(app),manifest=await deps.manifest(app),documents=await deps.load(manifest);
    const snapshot={education:input,documents:documents.map((d,i)=>({id:d.id,sha256:d.sha256,pages:d.pages,mime:d.mime,source:manifest[i]}))};
    await db()`update aet.aet_ai_runs set input=${db().json(snapshot)},input_hash=${digest(JSON.stringify({input:snapshot,model,prompt:PROMPT_VERSION}))}
      where id=${app.job_id} and lease=${lease}`;
    const generated=await deps.analyze(input,documents);
    const fresh=await readConverged(app.id);
    if(!fresh || JSON.stringify(academic(fresh))!==JSON.stringify(input) || manifestHash(await deps.manifest(app))!==manifestHash(manifest))throw new AIError('input_changed',true);
    saved=await db().begin(async tx=>{
      const current=await readConverged(app.id,tx,true);
      const valid=current && current.job_id===app.job_id && current.ai_active_run===lease && current.input_version===app.input_version
        && !current.uploads_pending && !['cancelled','needs_information'].includes(current.status);
      // Do not let an expired worker overwrite a newer lease's result/history.
      const rows=await tx`update aet.aet_ai_runs set state=${valid?'completed':'superseded'},output=${tx.json(generated.analysis)},
        model=${generated.model},response_id=${generated.responseId},usage=${tx.json(generated.usage)},completed_at=now(),lease=null,locked_at=null
        where id=${app.job_id} and lease=${lease} returning id`;
      if(!valid || !rows.length)return false;
      await saveResult(tx,current,{result:generated.analysis.result,reasoning:generated.analysis.reasoning},'openai');return true;
    });
  } catch(error) {
    const known=error instanceof AIError?error:new AIError('ai_processing_failed');
    await db()`update aet.aet_ai_runs set state=${known.retryable&&app.ai_attempts<3?'queued':'failed'},error=${known.code},
      lease=null,locked_at=null,available_at=now()+${Math.min(300,30*2**(app.ai_attempts-1))}*interval '1 second',completed_at=now()
      where id=${app.job_id} and current and lease=${lease}`;
  } finally {clearInterval(heartbeat);}
  if(saved)try{await deps.publish(app.id);}catch{console.error('Pre-evaluation publication incomplete; the next authorized read will retry.');}
  return true;
}
