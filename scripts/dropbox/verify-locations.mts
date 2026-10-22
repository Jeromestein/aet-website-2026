import { environmentValue } from "../../lib/application-environment.mjs";
/** Real, opt-in synthetic verification. Does not send mail or invoke AI/payments. */
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import postgres from 'postgres';
import { configuration, CLOUD_PROJECT } from '../../lib/preeval/config';
import { db, table } from '../../lib/preeval/db';
import { resolveStorage } from '../../lib/dropbox/storage';
import { type DocumentIdentity, type Location } from '../../lib/dropbox/paths';
import { clientForOffice, uploadSmall, listFiles, readDocument, readDiplomaImage, startUpload, continueUpload, dropboxHash, seal } from '../../lib/dropbox/server';
import { accountForOffice, CHUNK_SIZE } from '../../lib/dropbox/shared';
import { addFile as addPreevalFile } from '../../lib/preeval/service';
import { addFile as addFormalFile } from '../../lib/evaluation-application/service';
import { downloadFile } from '../../lib/preeval/dropbox';
import { initialData } from '../../lib/evaluation-application/domain';
assert.equal(process.env.DROPBOX_LIVE_VERIFY, '1', 'Explicit synthetic-test opt-in required');
assert.equal(configuration().cloudPreview, true, 'Only isolated preview database');
const origin = environmentValue("APP_ORIGIN")!;
assert.ok(/^http:\/\/(localhost|127\.0\.0\.1):\d+$/.test(origin), 'Only owner local server');
const adminUrl = new URL(process.env.STAFF_AUTH_DATABASE_URL!);
assert.ok(adminUrl.hostname === `db.${CLOUD_PROJECT}.supabase.co` || adminUrl.hostname.endsWith('.pooler.supabase.com') && decodeURIComponent(adminUrl.username).endsWith('.' + CLOUD_PROJECT));
const admin = postgres(adminUrl.toString(), { prepare: false, max: 1 });
const ids: string[] = [], folders: Location[] = [];
let assertions = 0;
const limitations: string[] = [];
const check = (value: unknown, message: string) => { assert.ok(value, message); assertions++; console.log('PASS ' + message); };
const png = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aI1sAAAAASUVORK5CYII=', 'base64');
const file = () => new File([png], 'Synthetic diploma.png', { type: 'image/png' });
const email = `synthetic-${randomUUID()}@example.invalid`;
function context(kind: 'evaluation' | 'pre-evaluation', office: DocumentIdentity['office'] = 'Miami') {
  const id = randomUUID(); ids.push(id);
  return { id, kind, office, fullName: 'AET Path Verification', folderKey: id, submittedAt: new Date().toISOString(), canUpload: true } satisfies DocumentIdentity;
}
async function reserve(location: Location) {
  const client = await clientForOffice(location.office);
  try { await client.filesGetMetadata({ path: location.path }); throw new Error('Refuse to reuse an existing folder'); }
  catch (error: any) { if (!error.error?.error_summary?.startsWith('path/not_found')) throw error; }
  folders.push(location);
}
async function allFiles(c: DocumentIdentity) {
  const files = []; let cursor: string | null = null;
  do { const page = await listFiles(c, cursor); files.push(...page.files); cursor = page.nextCursor; } while (cursor);
  return files;
}
try {
  for (const kind of ['evaluation', 'pre-evaluation'] as const) {
    const c = context(kind); const storage = await resolveStorage(c);
    await reserve(storage.write);
    const saved = await uploadSmall(c, file());
    check(saved.file.pathDisplay.endsWith(`AET Path Verification - ${c.id}/Synthetic diploma.png`), kind + ' uses name and application ID');
    check((await allFiles(c)).some(f => f.id === saved.file.id), kind + ' lists its upload');
    check((await readDocument(c, saved.file.id)).equals(png), kind + ' downloads identical bytes');
    const edited = { ...c, fullName: 'Changed Name', office: 'Boston' as const };
    check(JSON.stringify(await resolveStorage(edited)) === JSON.stringify(storage), kind + ' retains storage after name and office edits');
    check((await readDocument(edited, saved.file.id)).equals(png), kind + ' reads original account after office edit');
    if (kind === 'pre-evaluation') check(await readDiplomaImage(c) === png.toString('base64'), 'AI image reader uses saved file');
    const token = seal(accountForOffice(c.office), 'access', c);
    const form = new FormData(); form.set('file', new File([png], 'Synthetic HTTP.png', { type: 'image/png' }));
    const response = await fetch(origin + '/api/dropbox/upload', { method: 'POST', headers: { Origin: origin, Authorization: 'Bearer ' + token }, body: form });
    check(response.ok, kind + ' local HTTP upload succeeds');
    const listing = await fetch(origin + '/api/dropbox/viewFilesListFolder', { headers: { Authorization: 'Bearer ' + token } });
    const body = await listing.json();
    check(listing.ok && body.files.some((f: any) => f.name === 'Synthetic HTTP.png'), kind + ' local HTTP list retains upload');
  }
  const old = { ...context('pre-evaluation'), legacyFolderKey: email };
  const oldStorage = await resolveStorage(old);
  for (const location of oldStorage.reads) await reserve(location);
  const legacy = await (await clientForOffice('Miami')).filesUpload({ path: oldStorage.reads[1].path + '/Historical synthetic.png', contents: png, mode: { '.tag': 'add' }, autorename: false });
  const fresh = await uploadSmall(old, file());
  const combined = await allFiles(old);
  check(combined.length === 2, 'Historical email and new ID folders both listed');
  check((await readDocument(old, legacy.result.id)).equals(png), 'Historical email file readable without moving it');
  check((await readDocument(old, fresh.file.id)).equals(png), 'New ID file readable beside historical file');
  const samePerson = context('pre-evaluation');
  await resolveStorage(samePerson);
  const lookupWithEmail = { ...samePerson, legacyFolderKey: email };
  check((await allFiles(lookupWithEmail)).length === 0, 'New application cannot inherit old files for the same name/email');
  await assert.rejects(() => readDocument(samePerson, legacy.result.id)); assertions++;
  const invalidCursor = (await listFiles(old)).nextCursor;
  if (invalidCursor) { await assert.rejects(() => listFiles(samePerson, invalidCursor)); assertions++; }
  const concurrent = context('evaluation');
  const proposed = await Promise.all(Array.from({ length: 8 }, (_, i) => resolveStorage({ ...concurrent, fullName: `AET Concurrent ${i}` })));
  check(proposed.every(s => JSON.stringify(s) === JSON.stringify(proposed[0])), 'Concurrent initializers select one immutable location');
  const east = context('evaluation', 'Boston'); const eastStorage = await resolveStorage(east); await reserve(eastStorage.write);
  const eastFile = await uploadSmall(east, file());
  check(eastFile.file.pathDisplay.startsWith('/WebsitesDev/Boston/'), 'East account retains its base root');
  try { check((await readDocument(east, eastFile.file.id)).equals(png), 'East account download matches upload'); }
  catch (error: any) {
    if (!error.error?.user_message?.text?.includes("required scope 'files.content.read'")) throw error;
    limitations.push('East account lacks files.content.read; upload/list works, binary download is blocked by Dropbox.');
    console.log('LIMITATION ' + limitations.at(-1));
  }
  const largeContext = context('pre-evaluation'); const largeStorage = await resolveStorage(largeContext); await reserve(largeStorage.write);
  const bytes = Buffer.alloc(CHUNK_SIZE + 41, 32); Buffer.from('%PDF-1.7\nSynthetic document\n').copy(bytes);
  let upload = await startUpload(largeContext, { fileName: 'Synthetic large.pdf', fileSize: bytes.length, mime: 'application/pdf', contentHash: dropboxHash(bytes) }, Date.now() + 600000);
  for (let i = 0; i * CHUNK_SIZE < bytes.length; i++) upload = await continueUpload(largeContext, { action: 'append', uploadKey: upload.uploadKey, chunkIndex: i, chunkData: bytes.subarray(i * CHUNK_SIZE, (i + 1) * CHUNK_SIZE).toString('base64') }) as typeof upload;
  const finished = await continueUpload(largeContext, { action: 'finish', uploadKey: upload.uploadKey }) as any;
  check((await readDocument(largeContext, finished.file.id)).equals(bytes), 'Chunked pre-evaluation upload/download is byte identical');
  const pilot = context('pre-evaluation'); const pilotStorage = await resolveStorage(pilot); await reserve(pilotStorage.write);
  await db()`insert into ${table('preeval.applications')}(id,request_id,request_hash,email,first_name,last_name,country,locale) values(${pilot.id},${randomUUID()},'synthetic',${email},'AET Path','Verification','US','en')`;
  await addPreevalFile(pilot.id, file(), 'synthetic-verification');
  await addPreevalFile(pilot.id, file(), 'synthetic-verification');
  const saved = await db()`select dropbox_path from ${table('preeval.files')} where application_id=${pilot.id}`;
  check(saved.length === 1 && saved[0].dropbox_path.startsWith(pilotStorage.write.path + '/'), 'Pilot pre-evaluation addFile uses shared folder and deduplicates');
  check((await downloadFile(saved[0].dropbox_path)).equals(png), 'Pilot downloader reads new shared path');
  const formal = context('evaluation'); const formalStorage = await resolveStorage(formal); await reserve(formalStorage.write);
  const data = initialData(); data.client.office = 'Miami'; data.evaluee.first = 'AET Path'; data.evaluee.last = 'Verification';
  await db()`insert into ${table('evaluation.applications')}(id,request_id,request_hash,access_hash,locale,data,quote) values(${formal.id},${randomUUID()},'synthetic','synthetic','en',${db().json(data)},'{}')`;
  await addFormalFile(formal.id, file(), 'document', 'synthetic-verification');
  const report = new File(['%PDF-1.7\nSynthetic report\n%%EOF'], 'Synthetic report.pdf', { type: 'application/pdf' });
  await addFormalFile(formal.id, report, 'report', 'synthetic-verification');
  const formalFiles = await db()`select kind,dropbox_path from ${table('evaluation.files')} where application_id=${formal.id}`;
  check(formalFiles.every(f => f.dropbox_path.startsWith(formalStorage.write.path + '/')), 'Formal pilot uses shared application folder');
  check(formalFiles.find(f => f.kind === 'report')!.dropbox_path.includes('/_reports/'), 'Unreleased report is stored outside the customer listing');
  check((await allFiles(formal)).length === 1, 'Customer folder lists documents only, not unreleased reports');
  const isolated = { office: 'Miami' as const, path: environmentValue("DROPBOX_LEGACY_PILOT_ROOT")! + '/' + randomUUID() };
  await reserve(isolated);
  await (await clientForOffice('Miami')).filesUpload({ path: isolated.path + '/historical.png', contents: png, mode: { '.tag': 'add' }, autorename: false });
  check((await downloadFile(isolated.path + '/historical.png')).equals(png), 'Historical isolated-pilot path remains readable');
  console.log(`PASS ${assertions} real integration assertions; ${limitations.length} external permission limitation(s).`);
} finally {
  let failures = 0;
  for (const location of folders.reverse()) {
    try { await (await clientForOffice(location.office)).filesDeleteV2({ path: location.path }); }
    catch (error: any) { if (!error.error?.error_summary?.startsWith('path_lookup/not_found')) { failures++; console.error('Synthetic cleanup failed', location.path); } }
  }
  for (const id of ids) {
    await admin`delete from aet_preview_preeval.audit where application_id=${id}`;
    await admin`delete from aet_preview_preeval.files where application_id=${id}`;
    await admin`delete from aet_preview_preeval.applications where id=${id}`;
    await admin`delete from aet_preview_evaluation.audit where application_id=${id}`;
    await admin`delete from aet_preview_evaluation.files where application_id=${id}`;
    await admin`delete from aet_preview_evaluation.applications where id=${id}`;
    await admin`delete from aet_preview_evaluation.document_locations where application_id=${id}`;
  }
  await admin.end(); await db().end();
  assert.equal(failures, 0, 'All synthetic folders must be cleaned up');
  console.log('Synthetic records and files cleaned up; no customer files changed.');
}
