import assert from 'node:assert/strict';
import { createHash, randomBytes, randomInt, randomUUID } from 'node:crypto';
import { readFile, writeFile, unlink } from 'node:fs/promises';
import { db, table } from '../../lib/preeval/db';
import { configuration, PREVIEW_ROLE } from '../../lib/preeval/config';
import { initialData } from '../../lib/evaluation-application/domain';
import { staffDb } from '../../lib/staff/db';
import { staffAdmin } from '../../lib/staff/client';
import { submit as seedPreEvaluation } from '../../lib/preeval/service';

// Exercise the actual owner-run HTTP server and isolated cloud schemas. No mail or external files/payments.
assert.ok(Number(process.versions.node.split('.')[0]) >= 22, 'Node 22+ required');
assert.equal(configuration().cloudPreview, true);
assert.equal(process.env.STAFF_AUTH_SYNTHETIC_TEST, 'true');
const origin = configuration().origin, sql = db(), privileged = staffDb(), admin = staffAdmin();
const manifest = '/private/tmp/aet-cloud-business-fixture.json';
const digest = (v: string) => createHash('sha256').update(v).digest('hex');
const cleanupOnly = process.argv.includes('--cleanup');
const keep = process.argv.includes('--keep-for-browser');
const seedDirectly = process.argv.includes('--seed-directly');
if (!cleanupOnly) {
  const existing = await readFile(manifest).then(() => true, (error: NodeJS.ErrnoException) => { if (error.code === 'ENOENT') return false; throw error; });
  assert.equal(existing, false, 'Existing synthetic fixtures must be cleaned up before another run');
}
type Staff = { id: number; email: string; password: string; authId?: string; offices: string[]; cookie?: string; label: string };
type Case = { office: string | null; formal?: string; preeval?: string; formalCookie?: string; preevalCookie?: string; formalFile?: string; preevalFile?: string; email: string };
type State = { run: string; baseline: string; authBefore: number; productionCatalog: string; staff: Staff[]; cases: Case[]; checks: number };
const snapshot = async () => digest(JSON.stringify(await privileged`select s.*,u.hash,u.salt,u.lock_until from aet_private.staff_accounts s join public.users u on u.id=s.legacy_user_id where s.legacy_user_id>0 order by s.legacy_user_id`));
const catalog = async () => digest(JSON.stringify(await privileged`select c.relname,c.relrowsecurity,c.relacl::text,(select jsonb_agg(pg_get_triggerdef(t.oid) order by t.tgname) from pg_trigger t where t.tgrelid=c.oid and not t.tgisinternal) as triggers,(select jsonb_agg(row(p.polname,p.polcmd,p.polroles,pg_get_expr(p.polqual,p.polrelid),pg_get_expr(p.polwithcheck,p.polrelid)) order by p.polname) from pg_policy p where p.polrelid=c.oid) as policies from pg_class c join pg_namespace n on n.oid=c.relnamespace where n.nspname='public' and c.relkind='r' order by c.relname`));
let state: State = cleanupOnly ? JSON.parse(await readFile(manifest, 'utf8')) : { run: randomUUID(), baseline: await snapshot(), authBefore: (await privileged`select count(*)::int n from auth.users`)[0].n, productionCatalog: await catalog(), staff: [], cases: [], checks: 0 };
const persist = () => writeFile(manifest, JSON.stringify(state), { mode: 0o600 });
function check(value: unknown, message: string) { assert.ok(value, message); state.checks++; console.log('PASS ' + message); }
async function req(path: string, body?: unknown, cookie = '', expected = 200, extra: Record<string,string> = {}) {
  const response = await fetch(origin + '/api/' + path, { method: body === undefined ? 'GET' : 'POST', headers: { Origin: origin, Cookie: cookie, 'Content-Type': 'application/json', ...extra }, body: body === undefined ? undefined : JSON.stringify(body), signal: AbortSignal.timeout(45000) });
  const data = await response.json();
  assert.equal(response.status, expected, `${path}: expected ${expected}, received ${response.status}, ${data.error || 'unexpected response'}`);
  state.checks++;
  return { data, cookie: response.headers.getSetCookie().map(v => v.split(';')[0]).join('; ') || cookie, response };
}
async function cleanup() {
  for (const c of state.cases) {
    await sql.begin(async tx => {
      if (c.preeval) {
        for (const name of ['emails','audit','ai_runs','files','payments','tokens','sessions','educations']) await tx`delete from ${table('preeval.' + name)} where application_id=${c.preeval}`;
        await tx`delete from ${table('preeval.applications')} where id=${c.preeval}`;
        await tx`delete from ${table('public.aet_core_applications')} where id=${c.preeval}`;
      }
      if (c.formal) {
        await tx`delete from ${table('evaluation.applications')} where id=${c.formal}`;
        await tx`delete from ${table('public.fce_applications')} where id=${c.formal}`;
      }
      for (const key of ['evaluation:' + c.email, 'formal-link:' + c.formal, 'formal-checkout:' + c.formal]) await tx`delete from ${table('preeval.rate_limits')} where key=${digest(key)}`;
    });
  }
  for (const staff of state.staff) {
    await privileged.begin(async tx => {
      await tx`delete from aet_private.password_recovery where legacy_user_id=${staff.id}`;
      await tx`delete from aet_private.staff_accounts where legacy_user_id=${staff.id} and email=${staff.email}`;
      await tx`delete from public.users where id=${staff.id} and email=${staff.email}`;
      await tx`delete from aet_private.auth_attempts where key=${digest('login:email:' + staff.email)}`;
    });
    if (staff.authId) assert.equal((await admin.auth.admin.deleteUser(staff.authId)).error, null, 'Temporary Auth cleanup');
  }
  check(await snapshot() === state.baseline, 'All three real employee credentials, office scopes and pending mappings unchanged');
  check(await catalog() === state.productionCatalog, 'Production business tables, policies and triggers unchanged');
  check((await privileged`select count(*)::int n from auth.users`)[0].n === state.authBefore, 'Auth user count restored');
  const remaining = await sql`select (select count(*) from ${table('preeval.applications')} where email like ${'cloud-' + state.run + '%'}) + (select count(*) from ${table('evaluation.applications')} where data->'client'->>'email' like ${'cloud-' + state.run + '%'}) as n`;
  check(Number(remaining[0].n) === 0, 'Synthetic business records removed');
  await unlink(manifest).catch(() => {});
}
let succeeded = false;
try {
 if (cleanupOnly) { await cleanup(); succeeded = true; }
 else {
  check((await sql`select current_user`)[0].current_user === PREVIEW_ROLE, 'Business runtime uses the restricted cloud role');
  for (const name of ['public.users','public.fce_applications','auth.users','aet_private.staff_accounts']) {
    await assert.rejects(sql.unsafe(`select 1 from ${name} limit 0`), (e: any) => e.code === '42501');
    check(true, 'Business connection cannot read ' + name);
  }
  await assert.rejects(sql`update public.fce_applications set office=office where false`, (e: any) => e.code === '42501');
  check(true, 'Business connection cannot update production records');
  const exposure = await privileged`select nspname from pg_namespace where nspname in ('aet_preview_legacy','aet_preview_preeval','aet_preview_evaluation') and (has_schema_privilege('anon',oid,'USAGE') or has_schema_privilege('authenticated',oid,'USAGE'))`;
  check(exposure.length === 0, 'Browser database roles cannot access preview schemas');
  for (const api of ['evaluation','pre-evaluation']) await req(api + '/admin/applications', undefined, '', 401);
  const offices = ['Boston','New York','Miami','San Francisco','Los Angeles'];
  const templates = [ { label: 'all', offices }, { label: 'west', offices: offices.slice(2) }, { label: 'east', offices: offices.slice(0,2) } ];
  for (const template of templates) {
    const s: Staff = { ...template, id: -randomInt(100000000,2000000000), email: `aet-permissions-${state.run}-${template.label}@example.invalid`, password: 'Fixture-' + randomBytes(24).toString('hex') + '!' };
    state.staff.push(s); await persist();
    await privileged`insert into public.users(id,name,email) values(${s.id},'Temporary cloud permission fixture',${s.email})`;
    const created = await admin.auth.admin.createUser({ email: s.email, password: s.password, email_confirm: true, app_metadata: { aet_permission_fixture: state.run } });
    assert.equal(created.error, null, 'Create temporary confirmed test identity'); s.authId = created.data.user!.id; await persist();
    await privileged`insert into aet_private.staff_accounts(legacy_user_id,email,auth_user_id,migration_state,role,offices,include_unassigned) values(${s.id},${s.email},${s.authId},'complete',${s.label === 'all' ? 'admin' : 'staff'},${s.offices},true)`;
    const login = await req('staff-auth/login', { email: s.email, password: s.password }); s.cookie = login.cookie;
    check(login.response.headers.getSetCookie().some(c => c.includes('HttpOnly')), s.label + ' scoped staff signs in on 3022');
  }
  for (const [i, office] of [...offices, null].entries()) {
    const c: Case = { office, email: `cloud-${state.run}-${i}@example.invalid` }; state.cases.push(c);
    const data = initialData();
    Object.assign(data.client, { name: `Fictional ${office || 'Unassigned'} Applicant`, email: c.email, country: 'US', street: '123 Fictional Street', city: 'Miami', region: 'FL', postal: '33101', phone: '202-555-0149', office: 'Miami', purpose: 'education' });
    data.evaluee = { title: 'mx', first: 'Fictional', middle: '', last: 'Applicant', birth: '1995-02-28' };
    data.educations = [{ school: 'Fictional Cloud University', country: 'CA', degree: 'Bachelor of Science', start: '2013-09', end: '2017-06' }];
    data.services.document.tier = 'standard'; data.terms = true; data.notes = 'Disposable cloud permission fixture ' + state.run;
    const body = { requestId: randomUUID(), locale: 'en', data }, headers = { 'x-application-key': randomBytes(32).toString('hex') };
    const formal = await req('evaluation/applications', body, '', 201, headers); c.formal = formal.data.id; c.formalCookie = formal.cookie; await persist();
    check((await req('evaluation/applications', body, '', 200, headers)).data.id === c.formal, 'Formal submission retry preserves one application');
    // Boston/NY are legacy office fixtures; current public intake only offers the three western offices.
    // Keep workflow JSON at Miami to prove the legacy office (including NULL) is authoritative.
    await sql`update ${table('public.fce_applications')} set office=${office} where id=${c.formal}`;
    const input = { requestId: randomUUID(), locale: 'en', email: c.email, firstName: 'Fictional', lastName: office || 'Unassigned', country: 'CN', schoolName: 'Fictional Cloud University', countryOfStudy: 'CN', degreeObtained: 'Bachelor of Science', startDate: '2018-09', endDate: '2022-06', terms: true };
    // Fixture setup can use the domain service without consuming the public intake limiter.
    // The HTTP authentication, workspace and permission assertions below remain unchanged.
    if (seedDirectly) {
      const seeded = await seedPreEvaluation(input); c.preeval = seeded.app.id; c.preevalCookie = 'aet_preeval_session=' + seeded.token; await persist();
      check((await seedPreEvaluation(input)).app.id === c.preeval, 'Pre-evaluation fixture seeding preserves idempotency');
    } else {
      const preeval = await req('pre-evaluation/applications', input, '', 201); c.preeval = preeval.data.id; c.preevalCookie = preeval.cookie; await persist();
      check((await req('pre-evaluation/applications', input, '', 201)).data.id === c.preeval, 'Pre-evaluation retry preserves one application');
    }
    await sql`update ${table('preeval.applications')} set office=${office},ai_status='idle' where id=${c.preeval}`;
    c.formalFile = (await sql`insert into ${table('evaluation.files')}(application_id,kind,name,mime_type,bytes,sha256,dropbox_path,state,input_version) values(${c.formal},'document','Fictional document.pdf','application/pdf',100,${randomBytes(32).toString('hex')},${'/permission-fixture/' + randomUUID()},'ready',0) returning id`)[0].id;
    c.preevalFile = randomUUID();
    await sql`insert into ${table('preeval.files')}(id,application_id,name,mime_type,bytes,sha256,dropbox_path,state) values(${c.preevalFile},${c.preeval},'Fictional document.pdf','application/pdf',100,${randomBytes(32).toString('hex')},${'/permission-fixture/' + randomUUID()},'ready')`;
    const [bridge] = await sql`select (select count(*) from ${table('public.fce_educations')} where application_id=${c.formal}) as formal,(select count(*) from ${table('public.aet_core_educations')} where application_id=${c.preeval}) as preeval`;
    check(Number(bridge.formal) === 1 && Number(bridge.preeval) === 1, 'Legacy-compatible education rows created atomically without duplicate retries');
  }
  for (const staff of state.staff) {
    const allowedCases = state.cases.filter(c => c.office === null || staff.offices.includes(c.office));
    for (const api of ['evaluation','pre-evaluation']) {
      const list = await req(api + '/admin/applications?office=Boston', undefined, staff.cookie);
      if (api === 'evaluation') check(list.data.rows.every((row: any) => row.office === state.cases.find(c => c.formal === row.id)?.office), 'Queue office labels match the authoritative business record');
      const actual = list.data.rows.map((r: any) => r.id).sort();
      const expected = allowedCases.map(c => api === 'evaluation' ? c.formal : c.preeval).sort();
      check(JSON.stringify(actual) === JSON.stringify(expected) && list.data.total === expected.length, `${staff.label}: ${api} list restricted to approved offices despite query override`);
    }
    for (const c of state.cases) {
      const allowed = c.office === null || staff.offices.includes(c.office), expected = allowed ? 200 : 403;
      const formal = await req(`evaluation/applications/${c.formal}/admin`, undefined, staff.cookie, expected);
      await req(`pre-evaluation/applications/${c.preeval}`, undefined, staff.cookie, expected);
      const [before] = await sql`select staff_notes,version from ${table('evaluation.applications')} where id=${c.formal}`;
      await req(`evaluation/applications/${c.formal}/staff`, { action: 'notes', version: before.version, notes: `PRIVATE ${staff.label}` }, staff.cookie, expected);
      await req(`pre-evaluation/applications/${c.preeval}/staff`, { action: 'notes', notes: `PRIVATE ${staff.label}` }, staff.cookie, expected);
      await req(`evaluation/applications/${c.formal}/access-link`, {}, staff.cookie, expected);
      if (allowed) {
        check(formal.data.data.client.office === c.office, 'Formal details use the authoritative legacy office');
        await req(`evaluation/applications/${c.formal}/files/${randomUUID()}`, undefined, staff.cookie, 404);
      } else {
        await req(`evaluation/applications/${c.formal}/files/${c.formalFile}`, undefined, staff.cookie, 403);
        await req(`pre-evaluation/files/${c.preevalFile}`, undefined, staff.cookie, 403);
        await req(`evaluation/applications/${c.formal}/staff`, { action: 'release', version: before.version, fileId: randomUUID() }, staff.cookie, 403);
        const [after] = await sql`select staff_notes,version from ${table('evaluation.applications')} where id=${c.formal}`;
        check(JSON.stringify(before) === JSON.stringify(after), 'Denied office mutation leaves database unchanged');
      }
    }
    console.log(`Completed ${staff.label} office permission matrix.`);
  }
  await req('staff-workspace', undefined, '', 401);
  await req('staff-workspace', undefined, state.cases[2].formalCookie, 401);
  for (const staff of state.staff) {
    const allowed = state.cases.filter(c => c.office === null || staff.offices.includes(c.office));
    const expectedIds = allowed.flatMap(c => [c.formal, c.preeval]).sort();
    const first = (await req('staff-workspace', undefined, staff.cookie)).data;
    const second = (await req('staff-workspace?page=2', undefined, staff.cookie)).data;
    check(first.total === expectedIds.length && first.stats.total === expectedIds.length && first.counts.total === expectedIds.length, staff.label + ': dashboard totals scoped before aggregation');
    check(first.stats.outstanding === allowed.length * (11000 + 1988) && first.stats.documents === expectedIds.length, staff.label + ': dashboard amount and document metrics scoped');
    const rows = first.rows.concat(first.total > 7 ? second.rows : []);
    check(JSON.stringify(rows.map((r: any) => r.id).sort()) === JSON.stringify(expectedIds), staff.label + ': paginated dashboard includes exactly the authorized cases');
    check(rows.every((r: any) => r.office === state.cases.find(c => c.formal === r.id || c.preeval === r.id)?.office), 'Dashboard preserves authoritative office including unassigned');
    check(!JSON.stringify(first).includes('dropbox_path') && !JSON.stringify(first).includes('staff_notes'), 'Dashboard summary omits private storage and note fields');
    const formal = (await req('staff-workspace?view=formal', undefined, staff.cookie)).data;
    check(formal.total === allowed.length && formal.rows.every((r: any) => r.kind === 'formal'), 'Formal view scopes workflow');
    const documents = (await req('staff-workspace?view=documents', undefined, staff.cookie)).data;
    check(documents.total === expectedIds.length, 'Document view scopes files through parent applications');
    const unassignedOnly = (await req('staff-workspace?office=unassigned', undefined, staff.cookie)).data;
    check(unassignedOnly.total === 2 && unassignedOnly.stats.total === 2, 'Office filter scopes both list and metrics');
    const search = (await req('staff-workspace?q=' + allowed[0].formal, undefined, staff.cookie)).data;
    check(search.total === 1 && search.rows[0].id === allowed[0].formal && search.stats.total === expectedIds.length, 'Search finds exact reference without reducing overview totals');
    const named = (await req('staff-workspace?sort=name', undefined, staff.cookie)).data;
    check(named.rows.every((r: any,i: number) => !i || named.rows[i-1].name.toLowerCase() <= r.name.toLowerCase()), 'Name sorting occurs before pagination');
    check((await req('staff-workspace?q=%25', undefined, staff.cookie)).data.total === 0, 'Search treats wildcard characters literally');
    check((await req('staff-workspace?filter=completed', undefined, staff.cookie)).data.total === 0, 'Empty completed filter returns no invented records');
    check((await req('staff-workspace?page=999', undefined, staff.cookie)).data.page === Math.ceil(expectedIds.length / 7), 'Out-of-range page clamps to last page');
    const exported = await fetch(origin + '/api/staff-workspace?export=csv', { headers: { Cookie: staff.cookie! } });
    const csv = await exported.text();
    check(exported.status === 200 && csv.split('\r\n').length === expectedIds.length + 1 && expectedIds.every(id => csv.includes(id!)), 'Export includes all authorized pages');
    for (const c of state.cases.filter(c => c.office && !staff.offices.includes(c.office))) {
      await req('staff-workspace?office=' + encodeURIComponent(c.office!), undefined, staff.cookie, 403);
      await req('staff-workspace?office=' + encodeURIComponent(c.office!) + '&export=csv', undefined, staff.cookie, 403);
      check(!csv.includes(c.formal!) && !csv.includes(c.preeval!), 'Export excludes denied office records');
    }
    await req('staff-workspace?page=-1', undefined, staff.cookie, 400);
  }
  const west = state.staff[1], east = state.cases[0], unassigned = state.cases[5], miami = state.cases[2];
  await privileged`update aet_private.staff_accounts set include_unassigned=false where legacy_user_id=${west.id}`;
  await req(`evaluation/applications/${unassigned.formal}/admin`, undefined, west.cookie, 403);
  await req(`pre-evaluation/applications/${unassigned.preeval}`, undefined, west.cookie, 403);
  await req('staff-workspace?office=unassigned', undefined, west.cookie, 403);
  check((await req('staff-workspace', undefined, west.cookie)).data.stats.total === 6, 'Unassigned opt-out also reduces dashboard metrics');
  await privileged`update aet_private.staff_accounts set include_unassigned=true where legacy_user_id=${west.id}`;
  for (const api of ['evaluation','pre-evaluation']) await req(api + '/admin/applications', undefined, miami.formalCookie, 401);
  await req(`evaluation/applications/${miami.formal}/staff`, { action: 'notes', version: 1, notes: 'forbidden' }, miami.formalCookie, 401);
  await req(`evaluation/applications/${miami.formal}/access-link`, {}, miami.formalCookie, 401);
  await req(`evaluation/applications/${east.formal}`, undefined, miami.formalCookie, 401);
  await req(`pre-evaluation/applications/${east.preeval}`, undefined, miami.preevalCookie, 401);
  await req(`pre-evaluation/applications/${miami.preeval}/staff`, { action: 'notes', notes: 'forbidden' }, miami.preevalCookie, 401);
  const receipt = (await req(`evaluation/applications/${miami.formal}`, undefined, miami.formalCookie)).data;
  check(!('staff_notes' in receipt) && !('audit' in receipt) && receipt.total === 11000, 'Customer receipt preserves exact price and hides staff fields');
  const [version] = await sql`select version,input_version from ${table('evaluation.applications')} where id=${miami.formal}`;
  await req(`evaluation/applications/${miami.formal}/staff`, { action: 'notes', version: version.version - 1, notes: 'stale' }, west.cookie, 409);
  const report = (await sql`insert into ${table('evaluation.files')}(application_id,kind,name,mime_type,bytes,sha256,dropbox_path,state,input_version) values(${miami.formal},'report','Fictional report.pdf','application/pdf',100,${randomBytes(32).toString('hex')},${'/permission-fixture/' + randomUUID()},'ready',${version.input_version}) returning id`)[0].id;
  await req(`evaluation/applications/${miami.formal}/files/${report}`, undefined, miami.formalCookie, 403);
  await req(`evaluation/applications/${miami.formal}/staff`, { action: 'release', version: version.version, fileId: report }, west.cookie, 409);
  await sql`update ${table('evaluation.applications')} set payment_status='paid',status='processing' where id=${miami.formal}`;
  await req(`evaluation/applications/${miami.formal}/staff`, { action: 'release', version: version.version, fileId: report }, west.cookie);
  const released = (await req(`evaluation/applications/${miami.formal}`, undefined, miami.formalCookie)).data;
  check(released.status === 'completed' && released.released_file_id === report, 'Authorized report release requires payment and documents');
  check((await sql`select status,payment_status,due_amount from ${table('public.fce_applications')} where id=${miami.formal}`)[0].status === 'completed', 'Formal workflow trigger updates isolated legacy record');
  await sql`update ${table('preeval.applications')} set result='{"result":"PRIVATE TEST RESULT","reasoning":"Synthetic acceptance"}'::jsonb,result_version=1,ai_status='completed' where id=${miami.preeval}`;
  const unpaid = (await req(`pre-evaluation/applications/${miami.preeval}`, undefined, miami.preevalCookie)).data;
  check(unpaid.result === null && !JSON.stringify(unpaid).includes('PRIVATE') && !('notes' in unpaid), 'Unpaid customer cannot see results or staff notes');
  await sql`insert into ${table('preeval.payments')}(application_id,session_id,amount_cents,status,payment_intent) values(${miami.preeval},${'fixture_' + state.run},1988,'paid',${'fixture_pi_' + state.run})`;
  check(Number((await sql`select due_amount from ${table('public.aet_core_payments')} where application_id=${miami.preeval}`)[0].due_amount) === 19.88, 'Payment bridge stores exact decimal amount in legacy contract');
  await sql`update ${table('preeval.applications')} set payment_status='paid',status='completed' where id=${miami.preeval}`;
  check((await req(`pre-evaluation/applications/${miami.preeval}`, undefined, miami.preevalCookie)).data.result.result === 'PRIVATE TEST RESULT', 'Paid customer receives released pre-evaluation result');
  await sql`update ${table('preeval.applications')} set payment_status='refunded' where id=${miami.preeval}`;
  check((await req(`pre-evaluation/applications/${miami.preeval}`, undefined, miami.preevalCookie)).data.result === null, 'Refund revokes pre-evaluation result visibility');
  const outbox = await sql`select state,attempts,provider_id from ${table('preeval.emails')} where application_id=any(${state.cases.map(c => c.preeval!)}::uuid[])`;
  check(outbox.length === 6 && outbox.every(e => e.state === 'queued' && e.attempts === 0 && e.provider_id === null), 'Six deduplicated confirmation emails queued with zero delivery attempts');
  await req(`evaluation/applications/${miami.formal}/files/${miami.formalFile}`, undefined, west.cookie, 503);
  await req(`pre-evaluation/files/${miami.preevalFile}`, undefined, west.cookie, 503);
  check(true, 'Authorized downloads stop at disabled external storage; denied downloads fail before storage');
  await privileged`update aet_private.staff_accounts set active=false where legacy_user_id=${west.id}`;
  await req('evaluation/admin/applications', undefined, west.cookie, 401);
  await req('pre-evaluation/admin/applications', undefined, west.cookie, 401);
  await req('staff-workspace', undefined, west.cookie, 401);
  await privileged`update aet_private.staff_accounts set active=true where legacy_user_id=${west.id}`;
  check(await snapshot() === state.baseline, 'Real employee records remain unchanged during HTTP acceptance');
  check(await catalog() === state.productionCatalog, 'Production business policies and triggers remain unchanged during acceptance');
  if (keep) await writeFile(manifest, JSON.stringify(state), { mode: 0o600 });
  succeeded = true;
 }
} catch (e) {
  console.error(e instanceof assert.AssertionError ? e.message : `Cloud acceptance failed (${(e as any)?.code || (e as Error).name}); credentials omitted.`);
  process.exitCode = 1;
} finally {
 try { if (!cleanupOnly && (!keep || !succeeded)) await cleanup(); }
 finally { await sql.end(); await privileged.end(); }
}
console.log(`${state.checks} cloud business checks completed. ${succeeded && keep && !cleanupOnly ? 'Synthetic fixtures retained briefly for browser verification; cleanup required.' : 'Fixture cleanup completed.'}`);
