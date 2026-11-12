import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { applicationsEnabled } from '../lib/application-release';
import { applicationPilotOrigin } from '../lib/preview-environment';
import { staffConfiguration } from '../lib/staff/config';
vi.mock('server-only', () => ({}));
const redirect = vi.hoisted(() => vi.fn((url: string) => { throw new Error(url); }));
vi.mock('next/navigation', () => ({ redirect }));
import { requireApplicationPage } from '../lib/application-page-access';
beforeEach(() => {
  vi.stubEnv('APPLICATIONS_ENABLED', undefined); vi.stubEnv('APP_ENV', 'production');
  vi.stubEnv('VERCEL', '1'); vi.stubEnv('VERCEL_ENV', 'production'); vi.stubEnv('VERCEL_GIT_COMMIT_REF', 'main');
  vi.stubEnv('APP_ORIGIN', 'https://www.americantranslationservice.com');
});
afterEach(() => vi.unstubAllEnvs());
it('defaults closed in Production even with all business modes selected', () => {
  vi.stubEnv('APPLICATION_CORE_MODE', 'six-production'); vi.stubEnv('APPLICATION_DATABASE_MODE', 'production');
  expect(applicationsEnabled()).toBe(false);
  vi.stubEnv('APPLICATIONS_ENABLED', 'true'); expect(applicationsEnabled()).toBe(true);
  vi.stubEnv('APPLICATIONS_ENABLED', 'false'); expect(applicationsEnabled()).toBe(false);
});
it('rejects production with Preview masquerading settings and unknown runtimes', () => {
  vi.stubEnv('APPLICATIONS_ENABLED', 'true'); vi.stubEnv('APP_ENV', 'local'); expect(applicationsEnabled()).toBe(false);
  vi.stubEnv('VERCEL_ENV', undefined); expect(applicationsEnabled()).toBe(false);
});
it('redirects closed pages to fixed legacy destinations without forwarding customer queries', () => {
  expect(() => requireApplicationPage()).toThrow('https://app.americantranslationservice.com/credential-evaluation-application');
  expect(() => requireApplicationPage(true)).toThrow('https://app.americantranslationservice.com/degree-equivalency-tool');
});
it.each(['main','x/new-form','dev'])('allows configured Preview on %s without trusting arbitrary origins', branch => {
  vi.stubEnv('VERCEL_ENV','preview'); vi.stubEnv('VERCEL_GIT_COMMIT_REF',branch); vi.stubEnv('APP_ENV','preview');
  vi.stubEnv('APPLICATION_DATABASE_MODE','cloud-preview'); vi.stubEnv('STAFF_LEGACY_MIGRATION_ENABLED','false'); vi.stubEnv('STAFF_AUTH_CUTOVER_ENABLED','false');
  vi.stubEnv('VERCEL_BRANCH_URL','aet-preview-example.vercel.app'); vi.stubEnv('APP_ORIGIN','https://aet-preview-example.vercel.app');
  expect(applicationsEnabled()).toBe(true); expect(applicationPilotOrigin()).toBe('https://aet-preview-example.vercel.app');
  vi.stubEnv('APP_ORIGIN','https://other.vercel.app'); expect(applicationsEnabled()).toBe(false);
});
it('allows explicitly configured local testing, but not an explicit disabled flag', () => {
  vi.stubEnv('VERCEL',''); vi.stubEnv('VERCEL_ENV',''); vi.stubEnv('APP_ENV','local'); vi.stubEnv('APP_ORIGIN','http://localhost:3021');
  expect(applicationsEnabled()).toBe(true); vi.stubEnv('APPLICATIONS_ENABLED','false'); expect(applicationsEnabled()).toBe(false);
});
it('configures staff auth independently of application activation', () => {
  vi.stubEnv('APPLICATIONS_ENABLED','false'); vi.stubEnv('APPLICATION_CORE_MODE',''); vi.stubEnv('APPLICATION_DATABASE_MODE','');
  vi.stubEnv('SUPABASE_URL','https://example.supabase.co'); vi.stubEnv('SUPABASE_ANON_KEY','synthetic'); vi.stubEnv('STAFF_AUTH_DATABASE_URL','synthetic');
  vi.stubEnv('STAFF_LEGACY_MIGRATION_ENABLED','false'); vi.stubEnv('STAFF_AUTH_CUTOVER_ENABLED','false');
  expect(staffConfiguration().origin).toBe('https://www.americantranslationservice.com');
  vi.stubEnv('APP_ORIGIN','https://unapproved.invalid'); expect(staffConfiguration).toThrow();
});
function files(dir: string): string[] { return readdirSync(dir,{withFileTypes:true}).flatMap(e=>e.isDirectory()?files(join(dir,e.name)):[join(dir,e.name)]); }
const excluded = /^app\/api\/(?:payment\/|staff-|internal\/customer-status\/)/;
const routes = files('app/api').filter(p=>p.endsWith('/route.ts')&&!excluded.test(p));
describe('closed application HTTP boundary, including callbacks and internal workers', () => {
  it.each(routes)('%s rejects direct calls before any provider request or awaiting params', async file => {
    const provider = vi.spyOn(globalThis,'fetch').mockRejectedValue(new Error('Provider must not run'));
    try {
      const route = await import('../'+file);
      for (const method of ['GET','POST','PUT','DELETE','PATCH']) {
        if (!route[method]) continue;
        const request = new Request('https://www.americantranslationservice.com/api/test', { method });
        const context = { params: { then() { throw new Error('Handler must not await params'); } } };
        const response = await route[method](request,context);
        expect(response.status).toBe(503); expect(await response.json()).toEqual({error:'application_unavailable'});
        expect(response.headers.get('cache-control')).toContain('no-store');
      }
      expect(provider).not.toHaveBeenCalled();
    } finally { provider.mockRestore(); }
  });
});
it('keeps the existing expiry scheduler only', () => {
  expect(JSON.parse(readFileSync('vercel.json','utf8')).crons.map((x:{path:string})=>x.path)).toEqual(['/api/internal/customer-status/expire']);
});
