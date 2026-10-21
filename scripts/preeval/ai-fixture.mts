/** Controls only the synthetic fixture retained by verify-ai.mts. */
import assert from 'node:assert/strict';
import { readFile, unlink } from 'node:fs/promises';
import postgres from 'postgres';
import { configuration, CLOUD_PROJECT } from '../../lib/preeval/config';
import { db, table } from '../../lib/preeval/db';
import { clientForOffice } from '../../lib/dropbox/server';
assert.equal(process.env.PREEVAL_AI_VERIFY,'1'); assert.equal(configuration().cloudPreview,true);
const fixture = JSON.parse(await readFile('/tmp/aet-ai-ui-fixture.json','utf8'));
const ids = [fixture.id, fixture.other];
for (const id of ids) {
  const [app] = await db()`select * from ${table('preeval.applications')} where id=${id}`;
  assert.equal(app?.first_name,'AET AI'); assert.equal(app?.email,`synthetic-${id}@example.invalid`);
}
const action = process.argv[2];
try {
  if (action === 'cleanup') {
    const url = new URL(process.env.STAFF_AUTH_DATABASE_URL!);
    assert.ok(url.hostname === `db.${CLOUD_PROJECT}.supabase.co` || url.hostname.endsWith('.pooler.supabase.com') && decodeURIComponent(url.username).endsWith('.'+CLOUD_PROJECT));
    const admin = postgres(url.toString(), {prepare:false,max:1});
    try {
      for(const path of fixture.folders) {
        assert.ok(ids.some(id => path.includes('AET AI Verification - '+id) || path.includes('AET AI Verification - synthetic-'+id+'@example.invalid')) || path.startsWith(process.env.PREEVAL_DROPBOX_ROOT+'/'));
        await (await clientForOffice('Miami')).filesDeleteV2({path});
      }
      for(const id of ids) {
        for(const name of ['audit','ai_runs','emails','files','document_uploads','tokens','sessions','educations','payments']) await admin.unsafe(`delete from aet_preview_preeval.${name} where application_id=$1`,[id]);
        await admin`delete from aet_preview_preeval.applications where id=${id}`;
        await admin`delete from aet_preview_legacy.aet_core_educations where application_id=${id}`;
        await admin`delete from aet_preview_legacy.aet_core_applications where id=${id}`;
        await admin`delete from aet_preview_evaluation.document_locations where application_id=${id}`;
      }
    } finally { await admin.end(); }
    await unlink('/tmp/aet-ai-ui-fixture.json'); console.log('Synthetic UI fixture and files removed.');
  } else {
    assert.ok(['running','failed','unpaid','pending'].includes(action));
    await db()`update ${table('preeval.applications')} set uploads_pending=${action==='pending'},ai_status=${action==='failed'?'failed':action==='running'?'running':'idle'},ai_error=${action==='failed'?'document_unavailable':null},result=null,
      ai_active_run=null,payment_status=${action==='unpaid'?'unpaid':'paid'},status='processing' where id=${fixture.id}`;
    console.log('Synthetic UI state: '+action);
  }
} finally { await db().end(); }
