import { readFileSync } from 'node:fs';
import { createHash, randomUUID } from 'node:crypto';
import type { Sql, TransactionSql, JSONValue } from 'postgres';
import { assertRehearsalDatabase, backfillPreevaluation, type Options, type RehearsalReport } from './preeval-backfill';

type CohortItem = { applicationId: string; noChargeAuditId?: string; evidence: Omit<Options,'previewLayout'|'requireCutoverReady'|'providerAccount'> };
export type VerifiedHistoricalPayment = {
  id:string; applicationId:string; amountCents:number; currency:string;
  checkoutSessionId:string|null; paymentIntentId:string|null;
  status:string; refundedCents:number; providerMode:'test';
};
export type ConvergenceReport = {
  applications: RehearsalReport[];
  sourceCounts: Record<string,number>;
  targetCounts: Record<string,number>;
  sourceDigest: string;
  paymentEventIds: { source: string; target: string }[];
  uploadAttempts: { source: string; target: string }[];
  preservedCoreIds: string[];
  exemptedTestIds: string[];
};
const legacy = ['aet_core_applications','aet_core_educations','aet_core_payments'];
const core = ['aet_core_applications','aet_education','aet_service_detail','aet_documents','aet_payments'];
const ops = ['applications','educations','files','document_uploads','payments','payment_events','ai_runs','emails','audit','tokens','sessions','rate_limits'];
const moved:Record<string,string>={files:'aet_uploads',ai_runs:'aet_ai_runs',emails:'aet_emails',payment_events:'aet_payment_events',
  audit:'aet_audit',tokens:'aet_access_tokens',sessions:'aet_sessions',rate_limits:'aet_rate_limits'};
const fail=(condition:unknown,message:string)=>{if(condition)throw new Error(message);};
async function count(tx:TransactionSql,name:string){return Number((await tx`select count(*) n from ${tx(name)}`)[0].n);}

/** Entire source cohort or nothing. No environment-file lookup, remote provider call,
 * active core overwrite, historical exclusion, CASCADE or automatic deployment. */
export async function convergeHistoricalPreevaluation(sql:Sql, input:{providerAccount:string;cohort:CohortItem[];payments:VerifiedHistoricalPayment[]}):Promise<ConvergenceReport>{
  return sql.begin('isolation level serializable',async tx=>{
    await assertRehearsalDatabase(tx);
    fail(!/^acct_[a-zA-Z0-9_]+$/.test(input.providerAccount),'Verified Stripe test account required');
    const relations=[...ops.map(t=>'preeval.'+t),...legacy.map(t=>'public.'+t),...core.map(t=>'aet.'+t)].sort();
    // Hold the source and target stable across evidence checks, mapping and DROP.
    for(const name of relations)await tx`lock table ${tx(name)} in access exclusive mode`;
    const existingCore=await tx`select * from aet.aet_core_applications order by id`;
    const coreSnapshots:Record<string,JSONValue[]>={};
    for(const t of core)coreSnapshots[t]=(await tx`select to_jsonb(r) value from ${tx('aet.'+t)} r order by id`).map(r=>r.value);
    fail(existingCore.some(a=>a.primary_service!=='pre-evaluation'||a.request_hash_version!==1),
      'Only authoritative pre-evaluation core-v1 records can be preserved');
    const apps=await tx`select *,created_at::text created_at,updated_at::text updated_at,
      ai_available_at::text ai_available_at from preeval.applications order by id`;
    const expected=input.cohort.map(c=>c.applicationId).sort();
    fail(!apps.length||new Set(expected).size!==expected.length||JSON.stringify(expected)!==JSON.stringify(apps.map(a=>a.id)),
      'Every source application must be reconciled; exclusions cannot justify dropping a shared table');
    fail(existingCore.some(c=>!apps.some(a=>a.id===c.id&&a.request_id===c.request_id&&a.request_hash===c.request_hash)),
      'Core/workflow identity mismatch');
    fail((await tx`select id from public.aet_core_applications where id not in (select id from preeval.applications)`).length,
      'Unmapped legacy application');
    fail((await tx`select l.id from public.aet_core_educations l left join preeval.educations e on e.id=l.id and e.application_id=l.application_id where e.id is null`).length,
      'Unmapped legacy education');
    fail((await tx`select l.id from public.aet_core_payments l left join preeval.payments p on p.id::text=l.id and p.application_id=l.application_id where p.id is null`).length,
      'Standalone or unmapped legacy payment');
    fail((await tx`select id from preeval.files where state='uploading'`).length ||
      (await tx`select attempt_id from preeval.document_uploads where state='uploading'`).length,'Uploads must be quiescent before cutover');
    fail(apps.some(a=>a.ai_pipeline!=='openai'&&a.ai_status==='queued'),'Legacy AI pipeline needs explicit reconciliation');
    fail((await tx`select id from preeval.ai_runs where state='running'`).length ||
      apps.some(a=>a.ai_active_run||a.ai_status==='running'),'AI workers must be quiescent before cutover');
    fail((await tx`select id from preeval.emails where state='sending' or lease is not null`).length,'Mail deliveries must be quiescent before cutover');
    const snapshots:Record<string,JSONValue[]>={},sourceCounts:Record<string,number>={};
    for(const name of relations.filter(n=>!n.startsWith('aet.'))){
      const rows=await tx`select to_jsonb(t) value from ${tx(name)} t order by to_jsonb(t)::text`;
      snapshots[name]=rows.map(r=>r.value);sourceCounts[name]=rows.length;
    }
    fail(input.payments.length!==sourceCounts['preeval.payments'] || new Set(input.payments.map(p=>p.id)).size!==input.payments.length,
      'Every payment needs exactly one verified provider record');
    const report:ConvergenceReport={applications:[],sourceCounts,targetCounts:{},
      sourceDigest:createHash('sha256').update(JSON.stringify({sources:snapshots,canonical:coreSnapshots})).digest('hex'),paymentEventIds:[],uploadAttempts:[],preservedCoreIds:existingCore.map(a=>a.id),exemptedTestIds:[]};
    for(const a of apps){
      const item=input.cohort.find(c=>c.applicationId===a.id)!;
      fail(!item.evidence.verifiedServicePrice,'A reconciled service amount is required');
      const payments=await tx`select * from preeval.payments where application_id=${a.id}`;
      for(const p of payments){
        const verified=input.payments.find(v=>v.id===p.id);
        fail(!verified || verified.applicationId!==a.id || verified.providerMode!=='test' || verified.amountCents!==p.amount_cents ||
          verified.currency.toLowerCase()!==p.currency || verified.refundedCents!==p.refunded_cents || verified.status!==p.status ||
          verified.checkoutSessionId!==p.session_id || verified.paymentIntentId!==p.payment_intent,
          'Payment provider evidence does not match the ledger');
      }
      const states=payments.map(p=>p.status);
      const state=states.includes('refunded')?'refunded':states.includes('partially_refunded')?'partially_refunded':states.includes('paid')?'paid':
        states.some(s=>['creating','open','pending'].includes(s))?'pending':'unpaid';
      if(item.noChargeAuditId){
        const [e]=await tx`select * from preeval.audit where id::text=${item.noChargeAuditId} and application_id=${a.id}
          and action='test.payment_fixture' and actor='synthetic-e2e-test'`;
        fail(!e||e.detail?.synthetic!==true||e.detail?.noCharge!==true||typeof e.detail?.purpose!=='string'||!e.detail.purpose.trim()||
          payments.length||a.payment_status!=='paid'||existingCore.some(c=>c.id===a.id),
          'No-charge exception requires the original synthetic audit and no payment ledger');
        report.exemptedTestIds.push(a.id);
      }else fail(state!==a.payment_status,'Payment ledger does not support application status');
      fail(payments.some(p=>p.status==='creating'||p.currency!=='usd'),'Unsettled or unsupported payment requires reconciliation');
      const ready=await tx`select * from preeval.files where application_id=${a.id} and state='ready'`;
      fail(ready.length!==(item.evidence.files||[]).length,'Every ready file needs exactly one verified File ID');
      for(const file of ready){
        const matches=(item.evidence.files||[]).filter(f=>f.legacyFileId===file.id);
        fail(matches.length!==1||matches[0].size!==file.bytes,'File size or identity needs reconciliation');
      }
      const latestMail=await tx`select max(result_version) version from preeval.emails where application_id=${a.id}`;
      fail((latestMail[0]?.version||0)>a.result_version,'Email version exceeds saved result version');
      const existing=existingCore.find(c=>c.id===a.id);
      if(existing){
        // Core owns business fields. Never refresh it from retained workflow copies.
        const services=await tx`select * from aet.aet_service_detail where application_id=${a.id}`;
        const educations=await tx`select * from aet.aet_education where application_id=${a.id}`;
        const docs=await tx`select * from aet.aet_documents where application_id=${a.id}`;
        const [service]=services;
        fail(services.length!==1||service.service_type!=='pre-evaluation'||existing.status!==a.status||existing.office!==a.office||
          educations.length!==1||JSON.stringify(service.details.education_ids)!==JSON.stringify(educations.map(e=>e.id)),
          'Core service/education mapping requires reconciliation');
        const price=item.evidence.verifiedServicePrice!;
        fail(service.amount_cents!==price.amountCents||service.currency!==price.currency||service.pricing_source!==price.source,
          'Core service amount requires reconciliation');
        fail(docs.length!==ready.length,'Core file inventory requires reconciliation');
        for(const f of ready){
          const d=docs.find(d=>d.id===f.id),v=item.evidence.files!.find(v=>v.legacyFileId===f.id)!;
          fail(!d||d.storage_file_id!==v.fileId||d.storage_location!==v.storageLocation||d.storage_rev!==v.revision||
            Number(d.size_bytes)!==v.size||d.access_scope!=='customer_input','Core File ID evidence mismatch');
        }
        report.applications.push({applicationId:a.id,serviceId:service.id,educationIds:educations.map(e=>e.id),
          documentIds:docs.map(d=>d.id),paymentIds:payments.map(p=>p.id),exceptions:[]});
      }else report.applications.push(await backfillPreevaluation(tx,a.id,{...item.evidence,providerAccount:input.providerAccount}));
      const [s]=await tx`select * from aet.aet_service_detail where application_id=${a.id}`;
      fail(s.input_version!==a.input_version||s.status!==a.status||JSON.stringify(s.result?.content??null)!==JSON.stringify(a.result)||
        (s.result&&(s.result.version!==a.result_version||s.result.input_version!==a.input_version||
          s.result.status!==(a.status==='completed'&&a.payment_status==='paid'&&a.ai_status==='completed'&&!a.uploads_pending?'released':'draft'))),
        'Canonical result/state parity failed');
      const targetPayments=await tx`select * from aet.aet_payments where application_id=${a.id}`;
      fail(targetPayments.length!==payments.length,'Payment count mismatch');
      for(const p of payments){const target=targetPayments.find(t=>t.id===p.id);
        fail(!target||target.amount_cents!==p.amount_cents||target.refunded_cents!==p.refunded_cents||target.payment_status!==p.status||
          target.checkout_session_id!==p.session_id||target.payment_intent_id!==p.payment_intent||target.currency!==p.currency.toUpperCase()||target.provider!=='stripe'||
          target.provider_account!==input.providerAccount||target.provider_mode!=='test','Payment ledger parity failed');}
    }
    // Assert every pre-existing canonical row (including timestamps and snapshots)
    // is byte-for-byte equivalent before any source retirement.
    for(const t of core){
      const rows=await tx`select to_jsonb(r) value from ${tx('aet.'+t)} r order by id`;
      for(const before of coreSnapshots[t] as Record<string,JSONValue>[])
        fail(JSON.stringify(rows.find(r=>r.value.id===before.id)?.value)!==JSON.stringify(before),'Existing core row changed: '+t);
    }
    const schema=readFileSync(new URL('./converge-preeval-rehearsal.sql',import.meta.url),'utf8');
    const moveAt=schema.indexOf('-- Move operational records,');
    const dropAt=schema.indexOf('-- Retirement:');
    fail(moveAt<0||dropAt<=moveAt,'Retirement SQL contract changed');
    // The empty-fixture guard is replaced by the complete cohort reconciliation
    // above, not disabled by a user flag. The DDL itself is shared with that gate.
    await tx.unsafe(schema.slice(moveAt,dropAt));
    for(const a of apps){
      if(report.exemptedTestIds.includes(a.id)){
        const sourceAuditId=input.cohort.find(c=>c.applicationId===a.id)!.noChargeAuditId!;
        const [audit]=await tx`insert into aet.aet_audit(application_id,actor,action,detail)
          values (${a.id},'migration','test.payment_exemption.confirmed',${tx.json({source_audit_id:sourceAuditId,scope:'synthetic-test'})}) returning id`;
        await tx`update aet.aet_service_detail set amount_cents=0,pricing_source='manual',details=details||
          ${tx.json({payment_exemption:{scope:'synthetic-test',audit_id:String(audit.id),source_audit_id:sourceAuditId}})}::jsonb
          where application_id=${a.id} and service_type='pre-evaluation'`;
      }
      // Preserve original run rows. Reuse a matching settled run; otherwise add a
      // queue-control record without inventing a provider call or historical time.
      const candidates=await tx`select id from aet.aet_ai_runs where application_id=${a.id} and input_version=${a.input_version}
        and state=${a.ai_status} and error is not distinct from ${a.ai_error} order by created_at desc,id desc limit 1`;
      if(candidates.length)await tx`update aet.aet_ai_runs set current=true,uploads_pending=${a.uploads_pending},attempts=${a.ai_attempts},
        available_at=${a.ai_available_at}::text::timestamptz,locked_at=null,lease=null where id=${candidates[0].id}`;
      else await tx`insert into aet.aet_ai_runs(application_id,input_version,state,error,uploads_pending,attempts,available_at,input)
        values (${a.id},${a.input_version},${a.ai_status},${a.ai_error},${a.uploads_pending},${a.ai_attempts},${a.ai_available_at}::text::timestamptz,
          ${tx.json({migration_control:true,source_digest:report.sourceDigest})})`;
      // Seed the monotonic result counter even when the current result is absent.
      if(a.result_version>0)await tx`insert into aet.aet_audit(application_id,actor,action,detail)
        values (${a.id},'migration','result.saved',${tx.json({version:a.result_version,source:'legacy-version-floor',historical:true})})`;
      // Immutable retirement evidence, not a second mutable profile/read source.
      const history:Record<string,JSONValue[]>={};
      for(const name of ['preeval.applications','preeval.educations','preeval.payments',...legacy.map(t=>'public.'+t)])
        history[name]=snapshots[name].filter((row:any)=>row.application_id===a.id||(name.endsWith('applications')&&row.id===a.id));
      await tx`insert into aet.aet_audit(application_id,actor,action,detail)
        values (${a.id},'migration','source.retired',${tx.json({source_digest:report.sourceDigest,records:history})})`;
    }
    for(const attempt of await tx`select *,updated_at::text updated_at from preeval.document_uploads order by application_id,file_key`){
      const files=await tx`select * from aet.aet_uploads where application_id=${attempt.application_id} and name=${attempt.file_key}`;
      fail(files.length>1,'Ambiguous shared upload slot');
      if(attempt.state==='ready')fail(files.length!==1||files[0].state!=='ready','Ready shared upload has no verified file');
      if(files.length){
        fail(files[0].state!==attempt.state,'Shared and dedicated upload states disagree');
        await tx`update aet.aet_uploads set file_key=${attempt.file_key},attempt_id=${attempt.attempt_id},updated_at=${attempt.updated_at}
          where id=${files[0].id}`;
        report.uploadAttempts.push({source:attempt.attempt_id,target:files[0].id});
      }else{
        const id=randomUUID();
        await tx`insert into aet.aet_uploads(id,application_id,name,file_key,attempt_id,state,created_at,updated_at)
          values (${id},${attempt.application_id},${attempt.file_key},${attempt.file_key},${attempt.attempt_id},${attempt.state},${attempt.updated_at},${attempt.updated_at})`;
        report.uploadAttempts.push({source:attempt.attempt_id,target:id});
      }
    }
    for(const event of await tx`select id from aet.aet_payment_events order by id`){
      const target=input.providerAccount+':test:'+event.id;
      await tx`update aet.aet_payment_events set id=${target} where id=${event.id}`;
      report.paymentEventIds.push({source:event.id,target});
    }
    // Mail/access/provider receipts are moved intact, with their original IDs.
    for(const [source,target] of Object.entries(moved)){
      const n=await count(tx,'aet.'+target);report.targetCounts[target]=n;
      fail(n<sourceCounts['preeval.'+source],'Operational history lost: '+source);
      const rows=await tx`select to_jsonb(t) value from ${tx('aet.'+target)} t`;
      const key=source==='tokens'||source==='sessions'?'hash':source==='rate_limits'?'key':'id';
      const index=new Map(rows.map(r=>[r.value[key],r.value]));
      for(const old of snapshots['preeval.'+source] as Record<string,JSONValue>[]){
        const id=source==='payment_events'?input.providerAccount+':test:'+old.id:old[key];
        const next=index.get(id);fail(!next,'Operational identity lost: '+source);
        for(const [field,value] of Object.entries(old))
          fail(JSON.stringify(next[field])!==JSON.stringify(field===key?id:value),'Operational history changed: '+source+'.'+field);
      }
    }
    fail((await tx`select a.id from aet.aet_core_applications a left join aet.aet_ai_runs j on j.application_id=a.id and j.current where j.id is null`).length,
      'Missing current job state');
    await tx.unsafe(schema.slice(dropAt));
    fail((await tx`select tablename from pg_tables where schemaname='aet'`).length!==13,'Converged schema must contain exactly 13 tables');
    for(const t of core)report.targetCounts[t]=await count(tx,'aet.'+t);
    return report;
  });
}
