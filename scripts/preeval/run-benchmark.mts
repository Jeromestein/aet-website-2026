/** Private degree-only benchmark. No database/Dropbox writes or automatic retries. */
import assert from 'node:assert/strict';
import { readFile, realpath, mkdir, writeFile } from 'node:fs/promises';
import { resolve, relative, sep } from 'node:path';
import { performance } from 'node:perf_hooks';
import { z } from 'zod';
import { analyzeDocuments, aiConfiguration, responseBody } from '../../lib/preeval/openai';
import { AIError, digest, MAX_DOCUMENTS, MAX_TOTAL_BYTES, PROMPT_VERSION, type AnalysisDocument } from '../../lib/preeval/ai-contract';
import { validateDocument } from '../../lib/preeval/ai-documents';

const fileSchema = z.object({
  path:z.string(), sha256:z.string().regex(/^[a-f0-9]{64}$/), bytes:z.number().int().positive(),
  id:z.string().regex(/^document-\d+$/), mime:z.literal('application/pdf'), pages:z.number().int().min(1).max(10),
}).strict();
const inputSchema = z.object({version:z.literal(1),cases:z.array(z.object({
  id:z.string().regex(/^FCE-\d{3}$/),
  academic:z.object({school:z.literal(''),country:z.literal(''),degree:z.literal(''),start:z.literal(''),end:z.literal('')}).strict(),
  documents:z.array(fileSchema).min(1).max(MAX_DOCUMENTS),
}).strict()).min(1)}).strict();
const args=process.argv.slice(2);
assert.ok(args.every(a=>a==='--live'), 'Only --live is supported; omit it for offline preflight.');
const live=args.includes('--live');
const root=await realpath(resolve('.local/preeval-benchmark/fce-v1'));
const manifestBytes=await readFile(resolve(root,'model-inputs.json'));
const input=inputSchema.parse(JSON.parse(manifestBytes.toString('utf8')));
assert.equal(new Set(input.cases.map(c=>c.id)).size,input.cases.length,'Duplicate cases');
const prepared: {item:typeof input.cases[number]; documents:AnalysisDocument[]; preparationMs:number}[]=[];
const batchStart=performance.now();
for (const item of input.cases) {
  const start=performance.now();
  assert.equal(new Set(item.documents.map(d=>d.id)).size,item.documents.length,'Duplicate document IDs');
  assert.ok(item.documents.reduce((sum,d)=>sum+d.bytes,0)<=MAX_TOTAL_BYTES,'Byte limit exceeded');
  const documents:AnalysisDocument[]=[];
  const allowedRoot=resolve(root,'cases',item.id,'inputs');
  for (const entry of item.documents) {
    const path=await realpath(resolve(root,entry.path));
    const rel=relative(allowedRoot,path);
    assert.ok(rel && !rel.startsWith('..') && !rel.startsWith(sep) && !rel.includes(sep),'File outside case input directory');
    const bytes=await readFile(path);
    assert.equal(bytes.length,entry.bytes,'Size mismatch');
    assert.equal(digest(bytes),entry.sha256,'Hash mismatch');
    assert.equal(await validateDocument(bytes,entry.mime),entry.pages,'Page mismatch');
    documents.push({id:entry.id,mime:entry.mime,bytes,pages:entry.pages,sha256:entry.sha256});
  }
  assert.ok(documents.reduce((sum,d)=>sum+d.pages,0)<=20,'Total page limit exceeded');
  prepared.push({item,documents,preparationMs:performance.now()-start});
}
if (!live) {
  console.log(JSON.stringify({mode:'offline',cases:prepared.length,modelCalled:false,preflightMs:performance.now()-batchStart}));
} else {
  const {model}=aiConfiguration(); // Never print the returned API key.
  const runId=new Date().toISOString().replace(/[:.]/g,'-');
  const runDir=resolve(root,'runs',runId);
  await mkdir(runDir,{recursive:true,mode:0o700});
  const save=async (name:string,value:unknown)=>writeFile(resolve(runDir,name),JSON.stringify(value,null,2)+'\n',{mode:0o600,flag:'wx'});
  const body=responseBody(model,{school:'',country:'',degree:'',start:'',end:''},[]);
  const config={model,promptVersion:PROMPT_VERSION,reasoning:body.reasoning,maxOutputTokens:body.max_output_tokens,
    store:body.store,instructions:body.instructions,outputFormat:body.text,manifestSha256:digest(manifestBytes),
    codeSha256:Object.fromEntries(await Promise.all(['lib/preeval/openai.ts','lib/preeval/ai-contract.ts','lib/preeval/ai-pages.ts'].map(async p=>[p,digest(await readFile(p))]))),
    scope:'Local prepared files through production analyzeDocuments; excludes Dropbox/queue/database/email/browser',
    repeatsPerCase:1,automaticRetries:0,startedAt:new Date().toISOString()};
  await save('configuration.json',config);
  console.log(JSON.stringify({event:'start',runDir,model,cases:prepared.length}));
  const results:Record<string,unknown>[]=[];
  const inferenceStart=performance.now();
  for (const {item,documents,preparationMs} of prepared) {
    console.log(JSON.stringify({event:'case_start',id:item.id,pages:documents.reduce((sum,d)=>sum+d.pages,0)}));
    const start=performance.now();
    const raw: {httpStatus?:number;requestId?:string|null;body?:unknown}={};
    const transport:typeof fetch=async (url,init)=>{
      const response=await fetch(url,init);
      raw.httpStatus=response.status;raw.requestId=response.headers.get('x-request-id');
      try {raw.body=await response.clone().json();} catch { /* retain HTTP metadata for non-JSON errors */ }
      return response;
    };
    let result:Record<string,unknown>;
    try {
      const output=await analyzeDocuments(item.academic,documents,transport);
      result={id:item.id,status:'completed',analysisMs:performance.now()-start,preparationMs,...output};
    } catch(error) {
      result={id:item.id,status:'failed',analysisMs:performance.now()-start,preparationMs,
        errorCode:error instanceof AIError?error.code:'benchmark_error'};
    }
    result.inputs=item.documents;
    result.finishedAt=new Date().toISOString();
    await save(item.id+'.json',result);
    await save(item.id+'.provider.json',raw);
    results.push(result);
    console.log(JSON.stringify({event:'case_end',id:item.id,status:result.status,seconds:Number((Number(result.analysisMs)/1000).toFixed(3)),usage:result.usage,errorCode:result.errorCode}));
  }
  await save('summary.json',{runId,configuration:config,results,inferenceWallMs:performance.now()-inferenceStart,
    batchWallMs:performance.now()-batchStart,finishedAt:new Date().toISOString(),semanticReview:'pending'});
  console.log(JSON.stringify({event:'done',runDir,completed:results.filter(r=>r.status==='completed').length,failed:results.filter(r=>r.status==='failed').length}));
}
