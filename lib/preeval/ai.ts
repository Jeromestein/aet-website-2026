import 'server-only';
import { randomUUID } from 'node:crypto';
import { table, db, type Row } from './db';
import { publishIfReady } from './payments';
import { analyzeDocuments, aiConfiguration } from './openai';
import { documentManifest, loadDocuments, manifestHash } from './ai-documents';
import { AIError, digest, PROMPT_VERSION, type AcademicInput } from './ai-contract';

async function educationFor(id: string): Promise<AcademicInput> {
  const [education] = await db()`select * from ${table('preeval.educations')} where application_id=${id}`;
  if (!education) throw new AIError('education_missing');
  const [legacy] = await db()`select * from ${table('public.aet_core_educations')} where id=${education.id} and application_id=${id}`;
  return { school: legacy?.school_name ?? education.school_name, country: legacy?.country_of_study ?? education.country_of_study,
    degree: legacy?.degree_obtained ?? education.degree_obtained,
    start: legacy ? `${legacy.study_start_date.year}-${legacy.study_start_date.month}` : education.start_date,
    end: legacy ? `${legacy.study_end_date.year}-${legacy.study_end_date.month}` : education.end_date };
}
// Dependency injection is confined to worker tests. HTTP callers cannot choose a
// provider, document path, model or output. The real worker uses these defaults.
export type AIDependencies = {
  analyze: typeof analyzeDocuments; manifest: typeof documentManifest; load: typeof loadDocuments;
  configured: typeof aiConfiguration; publish: typeof publishIfReady;
};
const defaults: AIDependencies = { analyze: analyzeDocuments, manifest: documentManifest, load: loadDocuments, configured: aiConfiguration, publish: publishIfReady };
export async function processAI(applicationId?: string, dependencies: Partial<AIDependencies> = {}) {
  const deps = { ...defaults, ...dependencies };
  const { model } = deps.configured(); // Missing key/disabled configuration never consumes a job.
  const runId = randomUUID();
  const app = await db().begin(async tx => {
    const expired = await tx`update ${table('preeval.applications')} set ai_status=case when ai_attempts<3 then 'queued' else 'failed' end,
      ai_error='ai_interrupted',ai_active_run=null,ai_locked_at=null,ai_available_at=now()
      where ai_pipeline='openai' and ai_status='running' and ai_locked_at<now()-interval '8 minutes'
      and (${applicationId || null}::uuid is null or id=${applicationId || null}::uuid) returning id`;
    for (const row of expired) await tx`update ${table('preeval.ai_runs')} set state='failed',error='ai_interrupted',completed_at=now() where application_id=${row.id} and state='running'`;
    const [claimed] = await tx`update ${table('preeval.applications')} set ai_status='running',ai_active_run=${runId},ai_locked_at=now(),ai_attempts=ai_attempts+1,status='processing'
      where id=(select id from ${table('preeval.applications')} where ai_pipeline='openai' and ai_status='queued' and not uploads_pending
      and ai_available_at<=now() and status not in ('cancelled','needs_information') and (${applicationId || null}::uuid is null or id=${applicationId || null}::uuid)
      order by ai_available_at limit 1 for update skip locked) returning *`;
    if (claimed) await tx`insert into ${table('preeval.ai_runs')}(id,application_id,input_version,input,model,prompt_version)
      values (${runId},${claimed.id},${claimed.input_version},'{}'::jsonb,${model},${PROMPT_VERSION})`;
    return claimed;
  });
  if (!app) return false;
  const heartbeat = setInterval(() => {
    void db()`update ${table('preeval.applications')} set ai_locked_at=now() where id=${app.id} and ai_active_run=${runId} and ai_status='running'`.catch(() => {});
  }, 30000);
  heartbeat.unref();
  let saved = false;
  let stage = 'education';
  try {
    const academic = await educationFor(app.id);
    stage = 'manifest';
    const manifest = await deps.manifest(app);
    stage = 'documents';
    const documents = await deps.load(manifest);
    stage = 'snapshot';
    const input = { education: academic, documents: documents.map((d, i) => ({ id: d.id, sha256: d.sha256, pages: d.pages, mime: d.mime, source: manifest[i] })) };
    const inputHash = digest(JSON.stringify({ input, model, prompt: PROMPT_VERSION }));
    await db()`update ${table('preeval.ai_runs')} set input=${db().json(input)},input_hash=${inputHash} where id=${runId}`;
    stage = 'provider';
    const generated = await deps.analyze(academic, documents);
    stage = 'revalidation';
    // Provider-side edits and staff education edits may happen outside our uploader.
    if (manifestHash(await deps.manifest(app)) !== manifestHash(manifest) || JSON.stringify(await educationFor(app.id)) !== JSON.stringify(academic)) throw new AIError('input_changed', true);
    stage = 'result';
    saved = await db().begin(async tx => {
      const current = await tx`update ${table('preeval.applications')} set result=${tx.json({ result: generated.analysis.result, reasoning: generated.analysis.reasoning })},
        result_version=result_version+1,result_source='openai',ai_status='completed',ai_error=null,ai_active_run=null,ai_locked_at=null,updated_at=now()
        where id=${app.id} and input_version=${app.input_version} and ai_active_run=${runId} and not uploads_pending
        and status not in ('cancelled','needs_information') returning id`;
      await tx`update ${table('preeval.ai_runs')} set output=${tx.json(generated.analysis)},model=${generated.model},response_id=${generated.responseId},usage=${tx.json(generated.usage)},
        state=${current.length ? 'completed' : 'superseded'},completed_at=now() where id=${runId}`;
      if (current.length) await tx`insert into ${table('preeval.audit')}(application_id,actor,action,detail) values (${app.id},'ai','result.generated',${tx.json({ runId, model: generated.model, promptVersion: PROMPT_VERSION })})`;
      return Boolean(current.length);
    });
  } catch (error) {
    if (!(error instanceof AIError)) console.error('[preeval-ai] ' + JSON.stringify({ stage,
      name: error instanceof Error ? error.name : 'unknown' }));
    const known = error instanceof AIError ? error : new AIError('ai_processing_failed');
    await db().begin(async tx => {
      const updated = await tx`update ${table('preeval.applications')} set ai_status=${known.retryable && app.ai_attempts < 3 ? 'queued' : 'failed'},
        ai_error=${known.code},ai_active_run=null,ai_locked_at=null,ai_available_at=now()+${Math.min(300, 30 * 2 ** (app.ai_attempts - 1))} * interval '1 second',updated_at=now()
        where id=${app.id} and input_version=${app.input_version} and ai_active_run=${runId} and status not in ('cancelled','needs_information') returning id`;
      await tx`update ${table('preeval.ai_runs')} set state=${updated.length ? 'failed' : 'superseded'},error=${known.code},completed_at=now() where id=${runId}`;
    });
  } finally { clearInterval(heartbeat); }
  // Email enqueue is separate from generation; a notification failure must never
  // erase a completed assessment. The AI worker does not dispatch any emails.
  if (saved) {
    try { await deps.publish(app.id); }
    catch { console.error("Pre-evaluation publication incomplete; the next authorized read will retry."); }
  }
  return true;
}
