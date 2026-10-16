import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { businessTableName, configuration, requireExternalServices, CLOUD_PROJECT, PREVIEW_ROLE } from '../lib/preeval/config';
beforeEach(()=>{
 vi.stubEnv('PREEVAL_ENV','local');vi.stubEnv('PREEVAL_ORIGIN','http://localhost:3022');vi.stubEnv('PREEVAL_ADMIN_EMAIL','admin@example.invalid');vi.stubEnv('PREEVAL_TEST_EMAIL','test@example.invalid');
 vi.stubEnv('STAFF_LEGACY_MIGRATION_ENABLED','false');vi.stubEnv('STAFF_AUTH_CUTOVER_ENABLED','false');vi.stubEnv('PREEVAL_DATABASE_MODE','cloud-preview');
 vi.stubEnv('PREEVAL_DATABASE_URL',`postgresql://${PREVIEW_ROLE}.${CLOUD_PROJECT}:test@aws-0-us-west-1.pooler.supabase.com:6543/postgres`);
});
afterEach(()=>vi.unstubAllEnvs());
describe('cloud business preview containment',()=>{
 it('maps workflow and original tables to private preview schemas',()=>{expect(businessTableName('public.fce_applications')).toBe('aet_preview_legacy.fce_applications');expect(businessTableName('preeval.applications')).toBe('aet_preview_preeval.applications');expect(businessTableName('evaluation.sessions')).toBe('aet_preview_evaluation.sessions');});
 it('preserves local database table names',()=>{vi.stubEnv('PREEVAL_DATABASE_MODE','local');vi.stubEnv('PREEVAL_DATABASE_URL','postgresql://postgres:test@127.0.0.1:55422/postgres');expect(businessTableName('public.fce_applications')).toBe('public.fce_applications');});
 it.each(['http://localhost:3021','https://app.americantranslationservice.com'])('rejects an unapproved origin %s',origin=>{vi.stubEnv('PREEVAL_ORIGIN',origin);expect(()=>configuration()).toThrow();});
 it('rejects remote databases unless preview is explicit',()=>{vi.stubEnv('PREEVAL_DATABASE_MODE','local');expect(()=>configuration()).toThrow();});
 it('rejects a privileged remote connection',()=>{vi.stubEnv('PREEVAL_DATABASE_URL',`postgresql://postgres.${CLOUD_PROJECT}:test@aws-0-us-west-1.pooler.supabase.com:6543/postgres`);expect(()=>configuration()).toThrow();});
 it('rejects a different project',()=>{vi.stubEnv('PREEVAL_DATABASE_URL',`postgresql://${PREVIEW_ROLE}.different:test@aws-0-us-west-1.pooler.supabase.com:6543/postgres`);expect(()=>configuration()).toThrow();});
 it.each(['STAFF_LEGACY_MIGRATION_ENABLED','STAFF_AUTH_CUTOVER_ENABLED'])('rejects enabling %s in business preview',name=>{vi.stubEnv(name,'true');expect(()=>configuration()).toThrow();});
 it('blocks external mail/payment/storage/AI boundary helpers',()=>{expect(()=>requireExternalServices()).toThrow('External services are disabled');});
 it.each(['auth.users','aet_private.staff_accounts','public.users;drop table users','preeval.applications where true'])('rejects non-business identifiers %s',name=>{expect(()=>businessTableName(name)).toThrow();});
});
