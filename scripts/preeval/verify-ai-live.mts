/** Opt-in live GPT acceptance. Only newly created synthetic preview records/files. */
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import postgres from 'postgres';
import { PDFDocument } from 'pdf-lib';
import { configuration, CLOUD_PROJECT } from '../../lib/preeval/config';
import { db, table } from '../../lib/preeval/db';
import { saveLegacyPreeval } from '../../lib/legacy-application/store';
import { addFile, application } from '../../lib/preeval/service';
import { completeUploads } from '../../lib/preeval/ai-jobs';
import { processAI } from '../../lib/preeval/ai';
import { makeSession, COOKIE } from '../../lib/preeval/auth';
import { aiConfiguration } from '../../lib/preeval/openai';
import { contextFor } from '../../lib/dropbox/application';
import { resolveStorage } from '../../lib/dropbox/storage';
import { clientForOffice } from '../../lib/dropbox/server';

assert.equal(process.env.PREEVAL_AI_LIVE_VERIFY, '1');
assert.equal(configuration().cloudPreview, true);
assert.ok(/^http:\/\/(localhost|127\.0\.0\.1):3022$/.test(configuration().origin));
aiConfiguration();
const adminUrl = new URL(process.env.STAFF_AUTH_DATABASE_URL!);
assert.ok(adminUrl.hostname === `db.${CLOUD_PROJECT}.supabase.co` || adminUrl.hostname.endsWith('.pooler.supabase.com') && decodeURIComponent(adminUrl.username).endsWith('.'+CLOUD_PROJECT));
const admin = postgres(adminUrl.toString(), { prepare:false, max:1 });
const ids: string[] = [], folders: string[] = [];
const results: unknown[] = [];
const http = process.argv.includes('--http');
const browser = process.argv.includes('--browser');
assert.ok(!browser || http, '--browser requires --http');
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve,ms));
try {
  const allScenarios = ['conflict', 'blank', 'image', 'scan'] as const;
  const selected = process.argv.find(arg => arg.startsWith('--case='))?.slice(7);
  if (selected) assert.ok(allScenarios.some(scenario => scenario === selected));
  const scenarios = selected ? allScenarios.filter(scenario => scenario === selected) : allScenarios;
  for (const scenario of scenarios) {
    const id = randomUUID(), educationId = randomUUID(); ids.push(id);
    const input = { requestId:randomUUID(), locale:'en' as const, email:`synthetic-${id}@example.invalid`, firstName:'AET AI', middleName:'', lastName:'Live Verification', country:'CN', schoolName:'Synthetic University', countryOfStudy:'CN', degreeObtained:'Master of Science', startDate:'2018-09', endDate:'2022-06', terms:true as const };
    await db().begin(async tx => {
      await tx`insert into ${table('preeval.applications')}(id,request_id,request_hash,email,first_name,middle_name,last_name,country,locale,ai_pipeline,uploads_pending,ai_status)
        values(${id},${input.requestId},'synthetic-live',${input.email},${input.firstName},'',${input.lastName},'CN','en','openai',true,'idle')`;
      await saveLegacyPreeval(tx,id,educationId,input);
      await tx`insert into ${table('preeval.educations')}(id,application_id,school_name,country_of_study,degree_obtained,start_date,end_date) values(${educationId},${id},${input.schoolName},'CN',${input.degreeObtained},${input.startDate},${input.endDate})`;
    });
    const [app] = await db()`select * from ${table('preeval.applications')} where id=${id}`;
    const storage = await resolveStorage(contextFor({...app,created_at:new Date(app.created_at).toISOString()},'pre-evaluation'));
    assert.ok(storage.write.path.includes(id)); folders.push(storage.write.path);
    const pdf = await PDFDocument.create();
    const page = pdf.addPage([612,792]);
    if (scenario === 'conflict') {
      const lines = ['SYNTHETIC TEST DOCUMENT - NOT A REAL CREDENTIAL', 'Synthetic University', 'Country of study: China', 'Qualification awarded: Bachelor of Science', 'Study began: September 2018', 'Completed: June 2022'];
      lines.forEach((line,i) => page.drawText(line,{x:42,y:720-i*38,size:14}));
      const transcript = pdf.addPage([612,792]);
      ['SYNTHETIC TRANSCRIPT - NOT A REAL CREDENTIAL', 'Program: Bachelor of Science', 'Study duration: four academic years', 'This fixture does not verify institutional recognition.'].forEach((line,i) => transcript.drawText(line,{x:42,y:720-i*38,size:14}));
    }
    if (scenario === 'scan') {
      const raster = await pdf.embedPng(await readFile(new URL('../../tests/fixtures/preeval-synthetic-scan.png',import.meta.url)));
      page.drawImage(raster,{x:0,y:100,width:612,height:510});
    }
    const bytes = scenario === 'image' ? await readFile(new URL('../../tests/fixtures/preeval-synthetic-scan.png',import.meta.url)) : Buffer.from(await pdf.save());
    await addFile(id,new File([bytes],`Synthetic ${scenario}.${scenario==='image'?'png':'pdf'}`,{type:scenario==='image'?'image/png':'application/pdf'}),'live-synthetic-test');
    const started = Date.now();
    let cookie = '';
    const origin = configuration().origin;
    const endpoint = origin+'/api/pre-evaluation/applications/'+id;
    if (http) {
      cookie = COOKIE+'='+await makeSession(id,'customer',input.email);
      const denied = await fetch(endpoint+'/uploads-complete',{method:'POST',headers:{Origin:origin,'Content-Type':'application/json'},body:'{}'});
      assert.equal(denied.status,401);
      const pending = await fetch(endpoint,{headers:{Cookie:cookie}});
      assert.equal(pending.status,200); assert.equal((await pending.json()).ai_status,'idle');
      if (browser) {
        console.log('Open the synthetic result page and confirm uploaded files: '+origin+'/degree-equivalency-tool/application/success?applicationId='+id);
      } else {
        const completions = await Promise.all([1,2].map(()=>fetch(endpoint+'/uploads-complete',{method:'POST',headers:{Origin:origin,Cookie:cookie,'Content-Type':'application/json'},body:'{}'})));
        for (const response of completions) assert.equal(response.status,200);
      }
      const deadline = Date.now()+240000;
      let finished = false;
      while (Date.now()<deadline) {
        const [row] = await db()`select ai_status,ai_error from ${table('preeval.applications')} where id=${id}`;
        if (row.ai_status==='completed') { finished = true; break; }
        assert.notEqual(row.ai_status,'failed',row.ai_error || 'automatic execution failed');
        await delay(1000);
      }
      assert.ok(finished,'existing Next server must finish analysis without a separate worker');
    } else {
      await completeUploads(id); assert.equal(await processAI(id),true);
    }
    const elapsedSeconds = Math.round((Date.now()-started)/100)/10;
    const [saved] = await db()`select ai_status,ai_error,result,result_source from ${table('preeval.applications')} where id=${id}`;
    const [run] = await db()`select state,model,response_id,usage,input,output,error from ${table('preeval.ai_runs')} where application_id=${id} order by created_at desc limit 1`;
    console.log(JSON.stringify({scenario,elapsedSeconds,status:saved.ai_status,error:saved.ai_error,model:run.model,usage:run.usage,output:run.output}));
    assert.equal(saved.ai_status,'completed',saved.ai_error || run.error);
    assert.equal(run.state,'completed'); assert.equal(saved.result_source,'openai');
    assert.ok(run.response_id && run.usage.total_tokens>0);
    assert.equal(run.input.documents.length,1);
    assert.equal(run.input.documents[0].pages,scenario==='conflict'?2:1);
    assert.ok(run.input.documents[0].sha256 && run.input.documents[0].source.revision);
    assert.equal((await application(id)).result,null,'unpaid result remains hidden');
    if (scenario!=='blank') {
      assert.ok(run.output.issues.some((issue:{code:string})=>issue.code==='conflict'),'degree mismatch must be reported');
      assert.ok(/bachelor/i.test(run.output.facts.qualification || ''),'extract the degree from the file');
      if (scenario === 'image' || scenario === 'scan') {
        assert.equal(run.output.facts.institution,'Visual Fixture Institute','read pixels, not the entered form');
        assert.match(run.output.facts.country,/Canada/i);
      }
      assert.ok(run.output.evidence.some((e:{documentId:string;page:number})=>e.documentId==='document-1' && [1,2].includes(e.page)));
    } else {
      assert.equal(run.output.basis,'insufficient');
      assert.ok(run.output.issues.some((issue:{code:string})=>['insufficient','unreadable'].includes(issue.code)));
      assert.ok(Object.values(run.output.facts).every(value=>value===null),'blank evidence must not invent facts');
    }
    if (http) {
      const repeat = await fetch(endpoint+'/uploads-complete',{method:'POST',headers:{Origin:origin,Cookie:cookie,'Content-Type':'application/json'},body:'{}'});
      assert.equal(repeat.status,200);
      const customer = await fetch(endpoint,{headers:{Cookie:cookie}});
      assert.equal(customer.status,200); assert.equal((await customer.json()).result,null);
      const [file] = await db()`select id from ${table('preeval.files')} where application_id=${id} and state='ready'`;
      const download = await fetch(origin+'/api/pre-evaluation/files/'+file.id,{headers:{Cookie:cookie}});
      assert.equal(download.status,200); assert.deepEqual(Buffer.from(await download.arrayBuffer()),bytes);

      await delay(1000);
      const [count] = await db()`select count(*)::int as total from ${table('preeval.ai_runs')} where application_id=${id}`;
      assert.equal(count.total,1,'duplicate completion and result reads must not call GPT twice');
    } else assert.equal(await processAI(id),false,'completed job must not call GPT again');
    const [mail] = await db()`select count(*)::int as count from ${table('preeval.emails')} where application_id=${id}`;
    assert.equal(mail.count,0,'unpaid fixture must not enqueue mail');
    results.push({scenario,transport:http?'next-after':'direct-worker',model:run.model,usage:run.usage,elapsedSeconds,result:run.output.result});
    if (browser) {
      console.log('HTTP acceptance passed; synthetic result page remains available for 90 seconds, then cleanup runs.');
      await delay(90000);
    }
  }
  console.log('PASS live GPT acceptance: '+JSON.stringify(results));
} finally {
  try {
    for (const path of folders.reverse()) await (await clientForOffice('Miami')).filesDeleteV2({path});
    for (const id of ids) {
      for (const name of ['audit','ai_runs','emails','files','document_uploads','tokens','sessions','educations','payments']) await admin.unsafe(`delete from aet_preview_preeval.${name} where application_id=$1`,[id]);
      await admin`delete from aet_preview_preeval.applications where id=${id}`;
      await admin`delete from aet_preview_legacy.aet_core_educations where application_id=${id}`;
      await admin`delete from aet_preview_legacy.aet_core_applications where id=${id}`;
      await admin`delete from aet_preview_evaluation.document_locations where application_id=${id}`;
    }
    console.log('Synthetic live-test records and Dropbox folders removed.');
  } finally { await db().end(); await admin.end(); }
}
