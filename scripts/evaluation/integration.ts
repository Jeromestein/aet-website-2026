import assert from 'node:assert/strict';
import { randomBytes, randomUUID } from 'node:crypto';
import { initialData, quote } from '../../lib/evaluation-application/domain';
import { db } from '../../lib/preeval/db';
import { configuration } from '../../lib/preeval/config';

const { origin } = configuration();
const sql = db();
const ids: string[] = [];
let count = 0;
function check(ok: unknown, description: string) { assert.ok(ok, description); count++; console.log(`PASS ${description}`); }
function payload() {
  const data = initialData();
  data.client = { ...data.client, name: 'Fictional Evaluation API Test', email: `test-${randomUUID()}@example.test`, country: 'United States', street: '123 Fictional Street', city: 'Miami', region: 'FL', postal: '33101', phone: '+1 202 555 0149', office: 'Miami', purpose: 'education' };
  data.evaluee = { title: 'mx', first: 'Fictional', middle: '', last: 'Applicant', birth: '1995-02-28' };
  data.educations = [{ school: 'Fictional University', country: 'Canada', degree: 'Bachelor of Science', start: '2013-09', end: '2017-06' }];
  data.services.expert.tier = 'standard'; data.terms = true;
  data.notes = 'Disposable formal-evaluation integration fixture. No email, payment or file upload.';
  return { requestId: randomUUID(), locale: 'en', data };
}
async function post(body: unknown, key: string, requestOrigin = origin) {
  return fetch(origin + '/api/evaluation/applications', { method: 'POST', headers: { 'content-type': 'application/json', origin: requestOrigin, 'x-application-key': key }, body: typeof body === 'string' ? body : JSON.stringify(body) });
}
async function get(id: string, cookie = '') { return fetch(`${origin}/api/evaluation/applications/${id}`, { headers: { cookie } }); }
async function main() { try {
  const input = payload(); const key = randomBytes(32).toString('hex');
  const created = await post(input, key); check(created.status === 201, 'valid submission is persisted');
  const { id } = await created.json(); ids.push(id);
  const setCookie = created.headers.get('set-cookie')!; const cookie = setCookie.split(';')[0];
  check(/HttpOnly/i.test(setCookie) && /SameSite=strict/i.test(setCookie), 'receipt access uses a restricted HTTP-only cookie');
  const saved = await get(id, cookie); const receipt = await saved.json();
  check(saved.status === 200 && receipt.data.educations.length === 1, 'customer can reopen saved education');
  assert.deepEqual(receipt.quote, quote(input.data));
  check(receipt.quote.min === 63000, 'server recalculates the current website price');
  check(!('access_hash' in receipt) && !('request_hash' in receipt), 'receipt excludes credential and idempotency hashes');
  check(saved.headers.get('cache-control') === 'no-store', 'private responses cannot be cached');
  const duplicate = await post(input, key); check(duplicate.status === 200 && (await duplicate.json()).id === id, 'retries reuse the original application');
  const changed = structuredClone(input); changed.data.client.name = 'Changed Test';
  check((await post(changed, key)).status === 409, 'changed retry is not silently treated as saved');
  check((await post(input, randomBytes(32).toString('hex'))).status === 409, 'idempotency key alone cannot take over an application');
  check((await get(id)).status === 401, 'anonymous receipt read is denied');
  const second = payload(); const secondKey = randomBytes(32).toString('hex');
  const secondResponse = await post(second, secondKey); const secondId = (await secondResponse.json()).id; ids.push(secondId);
  check(secondResponse.status === 201 && (await get(secondId, cookie)).status === 401, 'one application cookie cannot access another');
  check((await post(payload(), key, 'https://untrusted.example')).status === 403, 'cross-origin submission is rejected');
  const noTerms = payload(); noTerms.data.terms = false;
  check((await post(noTerms, key)).status === 400, 'server requires consent');
  const badDates = payload(); badDates.data.educations[0].end = '2010-01';
  check((await post(badDates, key)).status === 400, 'server enforces education chronology');
  const injected = payload();
  check((await post({ ...injected, data: { ...injected.data, total: 1 } }, key)).status === 400, 'client-injected prices are rejected');
  check((await post('{broken json', key)).status === 400, 'malformed JSON fails safely');
  check((await post('x'.repeat(64001), key)).status === 413, 'oversized request bodies are bounded');
  const invalid = payload(); invalid.data.services.course.tier = 'sameday';
  check((await post(invalid, key)).status === 400, 'unpublished legacy tiers are rejected');
  await sql`update evaluation.applications set created_at=now()-interval '25 hours' where id=${id}`;
  check((await get(id, cookie)).status === 401, 'server rejects expired receipt credentials');
  const [permissions] = await sql`select has_schema_privilege('anon','evaluation','usage') as anon, has_schema_privilege('authenticated','evaluation','usage') as authenticated`;
  check(!permissions.anon && !permissions.authenticated, 'database schema is private to the server');
  console.log(`${count} formal evaluation API checks passed.`);
} finally {
  for (const id of ids.filter(Boolean)) await sql`delete from evaluation.applications where id=${id} and data->>'notes'='Disposable formal-evaluation integration fixture. No email, payment or file upload.'`;
  await sql.end();
} }
main().catch(error => { console.error(error); process.exitCode = 1; });
