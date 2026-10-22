// Offline regression checks. No local credentials or network access.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');
const env = { DROPBOX_DOCUMENTS_ENABLED: 'true', AET_APPLICATIONS_SUPABASE_URL: 'https://fixture.example', AET_APPLICATIONS_SUPABASE_ANON_KEY: 'fixture' };
for (const account of ['AET_App', 'AET_App_East']) for (const key of ['KEY', 'SECRET', 'REFRESH_TOKEN', 'NAMESPACE_ID']) env[`DROPBOX_${account}_${key}`] = `${account}_${key}_fixture`;
let rows = [], copies = [], deleted = [], sessions = new Map(), stored = [], fetches = [], archiveFail = false, finishFail = false;
async function fakeFetch(url, options) {
  fetches.push({ url: String(url), options });
  return Response.json(String(url).includes('/oauth2/') ? { access_token: 'fixture', expires_in: 14400 } : rows);
}
function load(relative, dependencies = {}) {
  const filename = path.resolve(__dirname, '..', relative);
  const { outputText } = ts.transpileModule(fs.readFileSync(filename, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 }, fileName: filename });
  const module = { exports: {} };
  vm.compileFunction(outputText, ['require', 'module', 'exports', 'process', 'fetch'], { filename })(name => name === 'server-only' ? {} : dependencies[name] ?? require(name), module, module.exports, { env }, fakeFetch);
  return module.exports;
}
const shared = load('lib/dropbox/shared.ts');
const C = shared.CHUNK_SIZE;
function incorrect(offset) { return { error: { error_summary: 'incorrect_offset/', error: { correct_offset: offset } } }; }
function save(args) {
  assert.equal(args.autorename, true);
  assert.equal(args.mode['.tag'], 'add');
  const identical = stored.find(file => file.original === args.path && file.content_hash === server.dropboxHash(args.contents));
  if (identical) return { result: identical };
  const duplicate = stored.some(file => file.original === args.path);
  const name = path.basename(args.path).replace(/\.pdf$/, duplicate ? ' (1).pdf' : '.pdf');
  const file = { '.tag': 'file', id: `id:${stored.length}`, name, original: args.path, path_display: `${path.dirname(args.path)}/${name}`, size: args.contents.length, server_modified: '2026-10-20T00:00:00Z', content_hash: server.dropboxHash(args.contents) };
  stored.push(file);
  return { result: file };
}
class Dropbox {
  constructor(config) { this.config = config; }
  async filesUpload(args) { assert.equal(args.content_hash, server.dropboxHash(args.contents)); return save(args); }
  async filesUploadSessionStart() { const id = `session-${sessions.size}`; sessions.set(id, { bytes: Buffer.alloc(0), closed: false }); return { result: { session_id: id } }; }
  async filesUploadSessionAppendV2(args) {
    const session = sessions.get(args.cursor.session_id);
    if (session.closed) throw { error: { error_summary: 'closed/' } };
    if (session.bytes.length !== args.cursor.offset) throw incorrect(session.bytes.length);
    session.bytes = Buffer.concat([session.bytes, args.contents]); session.closed = args.close;
    return { result: null };
  }
  async filesUploadSessionFinish(args) {
    if (finishFail) throw new Error('secret upstream details');
    const session = sessions.get(args.cursor.session_id);
    assert.equal(session.bytes.length, args.cursor.offset);
    return save({ ...args.commit, contents: session.bytes });
  }
  async filesCopyV2(args) { copies.push(args); if (archiveFail) throw new Error('archive'); return { result: {} }; }
  async filesDeleteV2(args) { deleted.push(args.path); return { result: {} }; }
  async filesListFolder() { return { result: { entries: stored.slice(0, 1), has_more: true, cursor: 'server-cursor' } }; }
  async filesListFolderContinue(args) { assert.equal(args.cursor, 'server-cursor'); return { result: { entries: stored.slice(1), has_more: false } }; }
  async filesDownload() { return { result: { fileBinary: Buffer.from('image fixture') } }; }
}
const paths = load('lib/dropbox/paths.ts', { './shared': shared });
const locations = new Map();
const resolveStorage = async context => {
 const key = context.kind + ':' + context.id;
 if (!locations.has(key)) locations.set(key, paths.initialStorage(context));
 return locations.get(key);
};
const download = load('lib/dropbox/download.ts', { './shared': shared });
// This suite covers formal uploads and legacy access. Preview AI/database
// transitions are exercised by the isolated PostgreSQL regression suites.
const unexpectedAIUpload = async () => { throw new Error('Unexpected preview AI database call in offline Dropbox checks'); };
const dependencies = { './shared': shared, './paths': paths, './storage': { resolveStorage }, './download': download,
  '../preeval/ai-jobs': { startDocumentUpload: unexpectedAIUpload, finishDocumentUpload: unexpectedAIUpload }, dropbox: { Dropbox } };
const server = load('lib/dropbox/server.ts', dependencies);
const coldServer = () => load('lib/dropbox/server.ts', dependencies);
const http = load('lib/dropbox/http.ts', { './shared': shared, './server': server, './paths': paths });
const application = load('lib/dropbox/application.ts', { './shared': shared, './server': server, './paths': paths });
const routes = Object.fromEntries(['access', 'upload', 'chunked-upload', 'viewFilesListFolder'].map(route => [route, load(`app/api/dropbox/${route}/route.ts`, { '@/lib/dropbox/server': server, '@/lib/dropbox/shared': shared, '@/lib/dropbox/http': http, '@/lib/dropbox/application': application })]));
const statusRoute = load('app/api/application-status/route.ts', { '@/lib/dropbox/application': application, '@/lib/dropbox/http': http });
const statusDocuments = load('lib/customer-status/documents.ts', { '@/lib/dropbox/shared': shared, '@/lib/dropbox/server': server, '@/lib/dropbox/application': application });
const context = { id: '00000000-0000-4000-8000-000000000001', kind: 'evaluation', office: 'Los Angeles', fullName: 'Synthetic Test', folderKey: '00000000-0000-4000-8000-000000000001', submittedAt: '2026-10-20T00:00:00Z' };
const expires = Date.now() + 60000;
const pdf = Buffer.from('%PDF-1.7\nSynthetic test only\n%%EOF');
const large = Buffer.alloc(C * 2 + 7, 32); pdf.copy(large);
const start = (extra = {}) => server.startUpload(context, { fileName: 'large.pdf', fileSize: large.length, mime: 'application/pdf', contentHash: server.dropboxHash(large), ...extra }, expires);
const append = (key, index, bytes = large.subarray(index * C, (index + 1) * C), instance = server) => instance.continueUpload(context, { action: 'append', uploadKey: key, chunkIndex: index, chunkData: bytes.toString('base64') });
const rejects = async (fn, code) => assert.rejects(fn, error => error.code === code);
async function main() {
  const nativeClient = await server.clientForOffice('Miami');
  const nativeResponse = await nativeClient.config.fetch('https://fixture.example/download');
  assert.ok(Buffer.isBuffer(await nativeResponse.buffer()), 'Legacy SDK downloads need a native-fetch buffer adapter');
  assert.equal(shared.accountForOffice('Boston'), 'AET_App_East');
  assert.equal(shared.accountForOffice('New York'), 'AET_App_East');
  for (const office of ['Miami', 'Los Angeles', 'San Francisco']) assert.equal(shared.accountForOffice(office), 'AET_App');
  assert.throws(() => shared.accountForOffice('unknown'));
  for (const name of ['../x.pdf', 'a/b.pdf', 'a\\b.pdf', 'x\u0000.pdf', '.', 'x.pdf ']) assert.throws(() => shared.validateFile(name, 10, 'application/pdf'));
  for (const size of [0, -1, 1.5, 50 * 1024 ** 2 + 1]) assert.throws(() => shared.validateFile('a.pdf', size, 'application/pdf'));
  shared.validateFile('a.pdf', 50 * 1024 ** 2, 'application/pdf');
  assert.throws(() => shared.validateFile('a.exe', 10, 'application/pdf'));
  const token = server.seal('AET_App', 'access', context);
  assert.deepEqual(coldServer().unseal(token, 'access').data, context);
  assert.throws(() => server.unseal(token, 'upload'));
  assert.throws(() => server.unseal(token.replace('AET_App.', 'AET_App_East.'), 'access'));
  assert.throws(() => server.unseal(`${token.slice(0, -10)}abcdefghij`, 'access'));
  assert.throws(() => server.unseal(server.seal('AET_App', 'access', context, 1), 'access'), error => error.code === 'expired');
  assert.match(server.folderPath(context), /^\/Team Files\/WebsitesDev\/Los Angeles\//);
  assert.match(server.folderPath({ ...context, office: 'Boston' }), /^\/WebsitesDev\/Boston\//);
  assert.match(server.laFolderPath(context), /\/2026\/October\/Synthetic Test/);
  const record = {id: context.id, source: 'preview', office: 'Los Angeles', status: 'submitted', submitted: context.submittedAt, evaluee: {first: 'Synthetic', middle: '', last: 'Test'}};
  const ready = statusDocuments.withDocuments(record);
  assert.equal(ready.documents.state, 'ready');
  const previewContext = server.unseal(ready.documents.token, 'access').data;
  assert.match(server.folderPath(previewContext), /\/WebsitesDev\/Los Angeles\//);
  assert.equal(previewContext.canUpload, true);
  assert.equal(server.unseal(statusDocuments.withDocuments({...record, status:'completed'}).documents.token, 'access').data.canUpload, false);
  const liveContext = server.unseal(statusDocuments.withDocuments({...record, source:'live'}, '2025-09-20T00:00:00Z').documents.token, 'access').data;
  assert.equal(server.folderPath(liveContext).includes('AET-FormalEvaluation-Test'), false);
  assert.match(server.laFolderPath(liveContext), /\/2025\/September\//);
  assert.equal(statusDocuments.withDocuments({...record,office:'invalid'}).documents.state, 'unavailable');
  assert.equal(statusDocuments.withDocuments({...record,evaluee:{first:'../unsafe'}}).documents.state, 'unavailable');
  env.DROPBOX_DOCUMENTS_ENABLED='false';
  assert.equal(statusDocuments.withDocuments(record).id, record.id);
  assert.equal(statusDocuments.withDocuments(record).documents.state, 'unavailable');
  env.DROPBOX_DOCUMENTS_ENABLED='true';
  const copyCount = copies.length;
  const previewFile = await server.uploadSmall(previewContext, new File([pdf], 'preview.pdf', {type:'application/pdf'}));
  assert.equal(previewFile.archive, 'saved');
  assert.equal(copies.length, copyCount + 1, 'All LA files use the legacy archive');
  stored = [];
  const previewUpload = await server.startUpload(previewContext, {fileName:'preview-large.pdf',fileSize:large.length,mime:'application/pdf',contentHash:server.dropboxHash(large)});
  await rejects(() => server.continueUpload(liveContext, {action:'cancel',uploadKey:previewUpload.uploadKey}), 'access');
  await server.continueUpload(previewContext, {action:'cancel',uploadKey:previewUpload.uploadKey});

  const pre = { ...context, kind: 'pre-evaluation', office: 'Miami', folderKey: context.id, legacyFolderKey: 'Case.Email@example.test' };
  assert.ok(server.folderPath(pre).endsWith('Synthetic Test - ' + context.id));
  assert.ok(paths.initialStorage(pre).reads[1].path.endsWith('Synthetic Test - Case.Email@example.test'));
  delete env.DROPBOX_AET_App_East_KEY;
  await rejects(() => server.clientForOffice('Boston'), 'unavailable');
  env.DROPBOX_AET_App_East_KEY = 'restored';
  await rejects(() => server.uploadSmall(context, new File(['bad'], 'a.pdf', { type: 'application/pdf' })), 'fileType');
  const first = await server.uploadSmall(context, new File([pdf], 'same.pdf', { type: 'application/pdf' }));
  const second = await server.uploadSmall(context, new File([pdf, ' different contents'], 'same.pdf', { type: 'application/pdf' }));
  assert.equal(second.file.name, 'same (1).pdf');
  assert.equal(copies.at(-1).from_path, second.file.id);
  assert.ok(copies.at(-1).to_path.endsWith('/same (1).pdf'));
  assert.equal(first.archive, 'saved');
  archiveFail = true;
  assert.equal((await server.uploadSmall(context, new File([pdf], 'archive.pdf', { type: 'application/pdf' }))).archive, 'failed');
  archiveFail = false;
  let upload = await start();
  await rejects(() => append(upload.uploadKey, 1), 'sequence');
  await rejects(() => append(upload.uploadKey, 0, pdf), 'sequence');
  await rejects(() => server.continueUpload({ ...context, id: 'other' }, { action: 'cancel', uploadKey: upload.uploadKey }), 'access');
  await rejects(() => server.continueUpload(context, { action: 'finish', uploadKey: upload.uploadKey }), 'sequence');
  const staleKey = upload.uploadKey;
  upload = await append(staleKey, 0);
  assert.equal((await append(staleKey, 0)).offset, C, 'Lost response retry acknowledges existing bytes');
  upload = await append(upload.uploadKey, 1, undefined, coldServer());
  upload = await append(upload.uploadKey, 2, undefined, coldServer());
  const finished = await coldServer().continueUpload(context, { action: 'finish', uploadKey: upload.uploadKey });
  assert.equal(finished.file.size, large.length);
  assert.equal(stored.at(-1).content_hash, server.dropboxHash(large));
  upload = await start({ contentHash: '0'.repeat(64) });
  for (let index = 0; index < 3; index++) upload = await append(upload.uploadKey, index);
  await rejects(() => server.continueUpload(context, { action: 'finish', uploadKey: upload.uploadKey }), 'integrity');
  assert.equal(deleted.length, 0, 'A supplied hash mismatch must never delete a potentially preexisting identical file');
  finishFail = true;
  await rejects(() => server.continueUpload(context, { action: 'finish', uploadKey: upload.uploadKey }), 'uncertain');
  finishFail = false;
  upload = await start();
  await append(upload.uploadKey, 0);
  await server.continueUpload(context, { action: 'cancel', uploadKey: upload.uploadKey });
  assert.equal([...sessions.values()].at(-1).closed, true, 'Cancel recovers acknowledged offset');
  const page = await server.listFiles(context);
  assert.equal((await server.listFiles(context, page.nextCursor)).files.length, stored.length - 1);
  await rejects(() => server.listFiles({ ...context, id: '00000000-0000-4000-8000-000000000002' }, page.nextCursor), 'access');
  const row = { id: context.id, email: 'Case.Email@example.test', first_name: 'Synthetic', last_name: 'Test', office: 'Boston', submitted_at: context.submittedAt, created_at: context.submittedAt, status: 'submitted', payment_status: 'paid', paid_at: context.submittedAt };
  rows = [row];
  let access = await application.applicationAccess({ applicationId: context.id, kind: 'evaluation', email: row.email.toLowerCase() });
  assert.equal(server.unseal(access.token, 'access').data.office, 'Boston');
  access = await application.applicationAccess({ applicationId: context.id, kind: 'pre-evaluation', email: row.email });
  assert.equal(server.unseal(access.token, 'access').data.folderKey, row.id);
  assert.equal(server.unseal(access.token, 'access').data.legacyFolderKey, row.email);
  assert.ok(fetches.at(-1).url.includes('purpose=eq.degree-equivalency'));
  await rejects(() => application.applicationAccess({ applicationId: context.id, kind: 'evaluation', email: 'wrong@example.test' }), 'access');
  rows = [];
  await rejects(() => application.applicationAccess({ applicationId: context.id, kind: 'evaluation', email: row.email }), 'access');
  const req = (body, headers = {}) => new Request('http://localhost:3021/api/dropbox/chunked-upload', { method: 'POST', headers: { Origin: 'http://localhost:3021', Authorization: `Bearer ${token}`, 'Content-Type': 'application/json', ...headers }, body });
  assert.equal((await routes['chunked-upload'].POST(req('{}', { Origin: 'https://other.example' }))).status, 403);
  assert.equal((await routes['chunked-upload'].POST(req('{}', { Authorization: '' }))).status, 401);
  assert.equal((await routes['chunked-upload'].POST(req('bad-json'))).status, 400);
  assert.equal((await routes['chunked-upload'].POST(req(' '.repeat(4 * 1024 ** 2 + 32769)))).status, 413);
  const safe = await http.handle(async () => { throw { status: 500, secret: 'DO_NOT_LEAK' }; });
  assert.equal((await safe.text()).includes('DO_NOT_LEAK'), false);
  rows = [row];
  for (const state of ['submitted', 'processing', 'completed', 'cancelled', '', 'unknown']) {
    row.status = state;
    const response = await statusRoute.POST(req(JSON.stringify({ applicationId: context.id, office: 'Miami', fullName: 'Untrusted', canUpload: true })));
    assert.equal(response.status, 200);
    assert.equal(response.headers.get('cache-control'), 'no-store');
    const status = await response.json();
    assert.equal(status.application.office, 'Boston', 'Never trust caller-supplied office');
    assert.equal(status.application.name, 'Synthetic Test');
    assert.equal(status.application.canUpload, ['submitted', 'processing'].includes(state));
    assert.equal('email' in status.application, false, 'Do not return the contact email to the browser');
    const accessContext = server.unseal(status.token, 'access').data;
    assert.equal(accessContext.canUpload, status.application.canUpload);
    const standalone = await application.applicationAccess({ applicationId: context.id, email: row.email, kind: 'evaluation' });
    assert.equal(standalone.canUpload, status.application.canUpload, 'Standalone access cannot bypass status restrictions');
    if (!status.application.canUpload) {
      const denied = req('{}', { Authorization: `Bearer ${status.token}` });
      assert.equal((await routes['upload'].POST(denied)).status, 403);
      assert.equal((await routes['chunked-upload'].POST(req('{}', { Authorization: `Bearer ${status.token}` }))).status, 403);
      assert.equal((await routes.viewFilesListFolder.GET(new Request('http://localhost/api/dropbox/viewFilesListFolder', { headers: { Authorization: `Bearer ${status.token}` } }))).status, 200);
    }
  }
  assert.equal((await statusRoute.POST(req(JSON.stringify({ applicationId: context.id }), { Origin: 'https://other.example' }))).status, 403);
  assert.equal((await statusRoute.POST(req(JSON.stringify({ applicationId: 'invalid' })))).status, 400);
  rows = [];
  assert.equal((await statusRoute.POST(req(JSON.stringify({ applicationId: context.id })))).status, 403);
  env.DROPBOX_DOCUMENTS_ENABLED = 'false';
  assert.equal((await routes['chunked-upload'].POST(req('{}'))).status, 503);
  console.log('PASS: account isolation, signed contexts, file validation, duplicate/LA copies, chunk sequencing, retry replay, cold instances, hash integrity, cancellation, pagination, application matching and HTTP boundaries');
}
main().catch(error => { console.error(error); process.exitCode = 1; });
