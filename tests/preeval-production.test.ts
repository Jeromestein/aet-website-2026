import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { randomUUID } from 'node:crypto';
import postgres from 'postgres';
import Stripe from 'stripe';

vi.mock('server-only', () => ({}));
const m = vi.hoisted(() => ({ sql: undefined as ReturnType<typeof postgres> | undefined,
  create: vi.fn(), retrieve: vi.fn(), intent: vi.fn(), account: vi.fn(), list: vi.fn(), expire: vi.fn() }));
vi.mock('../lib/preeval/db', async () => {
  const { convergedTableName } = await import('../lib/application-core/convergence-mode');
  const { businessTableName } = await import('../lib/preeval/config');
  return { db: () => m.sql!, table: (name: string) => m.sql!(convergedTableName(m.sql!, name) || businessTableName(name)), audit: async () => {} };
});
vi.mock('next/server', async original => ({ ...await original<typeof import('next/server')>(), after: () => {} }));
vi.mock('stripe', async original => {
  const actual = await original<typeof import('stripe')>();
  return { default: class extends actual.default {
    constructor(...args: ConstructorParameters<typeof actual.default>) {
      super(...args);
      this.accounts.retrieve = m.account;
      this.checkout.sessions.create = m.create;
      this.checkout.sessions.retrieve = m.retrieve;
      this.checkout.sessions.list = m.list;
      this.checkout.sessions.expire = m.expire;
      this.paymentIntents.retrieve = m.intent;
    }
  }};
});
import { configuration, businessTableName } from '../lib/preeval/config';
import { coreRuntimeConfiguration, coreSchema, assertCoreConnection } from '../lib/application-core/connection';
import { activateSixTableRuntime } from '../lib/application-core/convergence-mode';
import { applicationRecipient } from '../lib/preeval/recipients';
import { preEvaluationPaymentMode, preEvaluationWebhookSecret } from '../lib/preeval/payment-mode';
import { stripeClient, verifiedPreEvaluationStripeClient, handleStripeEvent, checkout, applyCheckout, cancelApplication } from '../lib/preeval/payments';
import { emailDispatchEnabled, applicationEmail, flushEmails, renderQueuedEmail } from '../lib/preeval/email';
import { submitConverged, readConverged, saveResult, publishConverged } from '../lib/application-core/converged-store';
import { compactNotificationRows } from '../lib/application-core/compact-notifications';
import { createCoreShadowReader } from '../lib/application-core/reader';
import { formalCore } from '../lib/application-core/formal-store';
import { applicationFolder } from '../lib/dropbox/paths';
import { requestMatchesApplicationOrigin } from '../lib/preview-environment';
import { staffConfiguration } from '../lib/staff/config';
import { TOTAL_CENTS } from '../lib/preeval/domain';
import { POST } from '../app/api/pre-evaluation/[...path]/route';

const env = {
  APP_ENV: 'production', APP_ORIGIN: 'https://app.americantranslationservice.com',
  APPLICATION_DATABASE_MODE: 'production', APPLICATION_CORE_MODE: 'six-production',
  APPLICATION_DATABASE_URL: 'postgresql://aet_runtime.qrxztgdemfodemlcabcq:synthetic@aws-0-us-west-1.pooler.supabase.com:6543/postgres',
  APPLICATION_TEST_EMAIL: 'test-only@example.invalid', APPLICATION_CORE_PROVIDER_ACCOUNT: 'acct_synthetic_live',
  VERCEL: '1', VERCEL_ENV: 'production', VERCEL_GIT_COMMIT_REF: 'main',
  STAFF_LEGACY_MIGRATION_ENABLED: 'false', STAFF_AUTH_CUTOVER_ENABLED: 'false',
  PREEVAL_STRIPE_MODE: 'live', STRIPE_LIVE_SECRET_KEY: 'sk_live_synthetic_never_sent',
  STRIPE_TEST_SECRET_KEY: 'sk_test_synthetic_never_sent',
  PREEVAL_STRIPE_LIVE_WEBHOOK_SECRET: 'whsec_synthetic_live_never_sent', STRIPE_TEST_WEBHOOK_SECRET: 'whsec_synthetic_test',
  PREEVAL_EMAIL_ENABLED: 'true', RESEND_DEFAULT_FROM_NAME: 'AET', RESEND_DEFAULT_FROM_ADDRESS: 'sender@example.invalid',
  SUPABASE_URL: 'https://example.invalid', SUPABASE_ANON_KEY: 'synthetic', STAFF_AUTH_DATABASE_URL: 'synthetic',
};
function productionEnv() { for (const [key, value] of Object.entries(env)) vi.stubEnv(key, value); }
beforeEach(() => {
  productionEnv();
  vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('External network forbidden')));
  m.account.mockReset().mockResolvedValue({ id: 'acct_synthetic_live' });
});
afterEach(() => { vi.unstubAllEnvs(); vi.unstubAllGlobals(); });

describe('explicit pre-evaluation release configuration (no providers contacted)', () => {
  it('selects the private six-table target and real stored recipient', () => {
    expect(configuration()).toMatchObject({ production: true, cloudPreview: false, recipient: '' });
    expect(coreSchema()).toBe('aet');
    expect(coreRuntimeConfiguration()).toMatchObject({ sixTables: true, production: true });
    expect(applicationRecipient(' Customer@Example.com ')).toBe('customer@example.com');
    expect(() => applicationRecipient('bad-email')).toThrow();
    expect(() => businessTableName('preeval.applications')).toThrow('six-table');
    expect(staffConfiguration().origin).toBe(env.APP_ORIGIN);
  });
  it.each([
    ['VERCEL_ENV', 'preview'], ['VERCEL_GIT_COMMIT_REF', 'dev'], ['VERCEL', ''],
    ['APP_ENV', 'preview'], ['APPLICATION_CORE_MODE', 'six-preview'], ['APPLICATION_DATABASE_MODE', 'cloud-preview'],
    ['STAFF_AUTH_CUTOVER_ENABLED', 'true'], ['STAFF_LEGACY_MIGRATION_ENABLED', 'true'],
    ['APP_ORIGIN', 'https://other.vercel.app'], ['APP_ORIGIN', 'http://app.americantranslationservice.com'],
    ['APP_ORIGIN', env.APP_ORIGIN + '/path'],
    ['APPLICATION_DATABASE_URL', env.APPLICATION_DATABASE_URL.replace('aet_runtime.', 'aet_preview_runtime.')],
    ['APPLICATION_DATABASE_URL', env.APPLICATION_DATABASE_URL.replace('aet_runtime.', 'postgres.')],
    ['APPLICATION_DATABASE_URL', env.APPLICATION_DATABASE_URL.replace('qrxztgdemfodemlcabcq', 'wrongproject')],
  ])('rejects mixed or unsafe configuration: %s', (key, value) => {
    vi.stubEnv(key, value); expect(configuration).toThrow();
  });
  it('does not require the test mailbox in Production', () => {
    vi.stubEnv('APPLICATION_TEST_EMAIL', ''); expect(configuration().production).toBe(true);
  });
  it('keeps Preview recipients and test keys even with a live key present', () => {
    for (const [key, value] of Object.entries({ APP_ENV:'preview', APP_ORIGIN:'https://synthetic.vercel.app',
      APPLICATION_DATABASE_MODE:'cloud-preview', APPLICATION_CORE_MODE:'six-preview',
      APPLICATION_DATABASE_URL:env.APPLICATION_DATABASE_URL.replace('aet_runtime.', 'aet_preview_runtime.'),
      VERCEL_ENV:'preview', VERCEL_GIT_COMMIT_REF:'dev', VERCEL_BRANCH_URL:'synthetic.vercel.app',
      PREEVAL_STRIPE_MODE:'test', PREEVAL_STRIPE_TEST_ENABLED:'true' })) vi.stubEnv(key, value);
    expect(applicationRecipient('customer@example.com')).toBe(env.APPLICATION_TEST_EMAIL);
    expect(preEvaluationPaymentMode()).toBe('test');
    expect(preEvaluationWebhookSecret()).toBe(env.STRIPE_TEST_WEBHOOK_SECRET);
    expect(stripeClient('pre-evaluation')).toBeDefined();
    vi.stubEnv('PREEVAL_STRIPE_MODE', 'live'); expect(() => stripeClient('pre-evaluation')).toThrow('mode');
  });
  it('requires live mode, live keys and a dedicated live signing secret', () => {
    expect(preEvaluationWebhookSecret()).toBe(env.PREEVAL_STRIPE_LIVE_WEBHOOK_SECRET);
    vi.stubEnv('PREEVAL_STRIPE_MODE', 'test'); expect(() => stripeClient('pre-evaluation')).toThrow('mode');
    vi.stubEnv('PREEVAL_STRIPE_MODE', 'live');
    vi.stubEnv('STRIPE_LIVE_SECRET_KEY', 'sk_test_wrong'); expect(() => stripeClient('pre-evaluation')).toThrow('Only Stripe live');
    vi.stubEnv('PREEVAL_STRIPE_LIVE_WEBHOOK_SECRET', ''); expect(preEvaluationWebhookSecret).toThrow('Missing');
    expect(() => stripeClient('formal-evaluation')).toThrow('not enabled');
  });
  it('verifies the real account before permitting a live Checkout call', async () => {
    await verifiedPreEvaluationStripeClient(); expect(m.account).toHaveBeenCalledTimes(1);
    m.account.mockResolvedValue({ id:'acct_wrong' });
    await expect(verifiedPreEvaluationStripeClient()).rejects.toThrow('account');
  });
  it('rejects a test event in Production before accessing the database', async () => {
    await expect(handleStripeEvent({livemode:false} as Stripe.Event)).rejects.toThrow('test_event_rejected');
  });
  it('uses a private Production document root and only the canonical form origin', () => {
    const id = randomUUID();
    const identity = { id, kind:'pre-evaluation' as const, office:'Miami' as const,
      fullName:'Synthetic Applicant', folderKey:id, submittedAt:'2026-11-11' };
    expect(applicationFolder(identity)).toBe(`/Team Files/AET2026/Miami/Synthetic Applicant - ${id}`);
    expect(applicationFolder({...identity,office:'Boston'})).toBe(`/AET2026/Boston/Synthetic Applicant - ${id}`);
    expect(requestMatchesApplicationOrigin(env.APP_ORIGIN, env.APP_ORIGIN)).toBe(true);
    expect(requestMatchesApplicationOrigin('https://synthetic.vercel.app', env.APP_ORIGIN)).toBe(false);
  });
  it('requires explicit email enablement and one application scope', () => {
    expect(emailDispatchEnabled(randomUUID())).toBe(true);
    expect(emailDispatchEnabled()).toBe(false);
    vi.stubEnv('PREEVAL_EMAIL_ENABLED', 'false'); expect(emailDispatchEnabled(randomUUID())).toBe(false);
  });
});

const pg = process.env.APPLICATION_CORE_TEST_PG_BIN;
describe.skipIf(!pg)('Production runtime rehearsal on an owned local PostgreSQL cluster', () => {
  let dir: string, started = false, admin: ReturnType<typeof postgres>, runtime: ReturnType<typeof postgres>;
  const sessions = new Map<string, Stripe.Checkout.Session>();
  const input = () => ({ requestId:randomUUID(), email:'applicant@example.invalid', firstName:'Synthetic', middleName:'',
    lastName:'Applicant', country:'US', locale:'en', schoolName:'Synthetic University', countryOfStudy:'US',
    degreeObtained:'Bachelor', startDate:'2018-09', endDate:'2022-06', terms:true, uploadsPending:false });
  beforeAll(async () => {
    productionEnv();
    dir=mkdtempSync(join(tmpdir(),'aet-production-runtime-'));
    execFileSync(join(pg!,'initdb'),['-D',join(dir,'data'),'-U','core_rehearsal','-A','trust','--locale=C','--encoding=UTF8'],{stdio:'pipe'});
    execFileSync(join(pg!,'pg_ctl'),['-D',join(dir,'data'),'-l',join(dir,'pg.log'),'-o',`-F -k ${dir} -h '' -p 55452`,'-w','start'],{stdio:'pipe'}); started=true;
    const options={host:dir,port:55452,database:'postgres',max:3,onnotice:()=>{}};
    admin=postgres({...options,username:'core_rehearsal'});
    await admin.unsafe('create role anon; create role authenticated; create role aet_runtime login; create table public.legacy_guard(id int);');
    // An empty copy of the accepted six-table contract, in this owned cluster only.
    const schema=readFileSync(new URL('../supabase/migrations/20261111010750_preview_six_table_core.sql',import.meta.url),'utf8')
      .replaceAll('aet_preview_shared','aet').replaceAll('aet_preview_runtime','aet_runtime');
    await admin.unsafe(schema);
    runtime=postgres({...options,username:'aet_runtime'}); m.sql=runtime;
    await activateSixTableRuntime(runtime);
  },60000);
  afterAll(async () => {
    await runtime?.end(); await admin?.end();
    if(started)execFileSync(join(pg!,'pg_ctl'),['-D',join(dir,'data'),'-m','immediate','-w','stop'],{stdio:'pipe'});
    if(dir)rmSync(dir,{recursive:true,force:true});
  });
  beforeEach(() => {
    sessions.clear();
    m.create.mockReset().mockImplementation(async (args: Stripe.Checkout.SessionCreateParams) => {
      const s={id:'cs_'+args.client_reference_id, livemode:true, mode:'payment', status:'open', payment_status:'unpaid',
        currency:'usd',amount_total:TOTAL_CENTS,client_reference_id:args.client_reference_id,metadata:args.metadata,
        payment_intent:'pi_'+args.client_reference_id,url:'https://checkout.example.invalid/live'} as Stripe.Checkout.Session;
      sessions.set(s.id,s);return s;
    });
    m.retrieve.mockReset().mockImplementation(async (id:string) => sessions.get(id));
    m.expire.mockReset().mockResolvedValue({});
    m.intent.mockReset().mockImplementation(async (id:string) => ({id,livemode:true,status:'succeeded',currency:'usd',amount:TOTAL_CENTS,
      latest_charge:{id:'ch_'+id,livemode:true,currency:'usd',amount:TOTAL_CENTS,amount_refunded:0,payment_intent:id}}));
  });
  async function ready() {
    const a=await submitConverged(input());
    await runtime.begin(async tx => {
      await saveResult(tx,a,{result:'Synthetic degree',reasoning:'Synthetic analysis for offline runtime testing.'},'fixture');
      await tx`update aet.aet_ai_runs set state='completed' where application_id=${a.id} and current`;
    });
    return a;
  }
  async function paid(id:string) {
    await checkout(id);
    const s={...sessions.get('cs_'+id)!,status:'complete',payment_status:'paid'} as Stripe.Checkout.Session;
    sessions.set(s.id,s); return s;
  }
  async function webhook(s:Stripe.Checkout.Session, secret=env.PREEVAL_STRIPE_LIVE_WEBHOOK_SECRET) {
    const payload=JSON.stringify({id:'evt_'+s.id,type:'checkout.session.completed',livemode:true,data:{object:s}});
    const signature=Stripe.webhooks.generateTestHeaderString({payload,secret});
    return POST(new Request(env.APP_ORIGIN+'/api/pre-evaluation/stripe-webhook',{method:'POST',body:payload,headers:{'stripe-signature':signature}}),
      {params:Promise.resolve({path:['stripe-webhook']})});
  }
  it('keeps the actual role private and rejects legacy/public grants', async () => {
    await expect(assertCoreConnection(admin)).rejects.toThrow('restricted database role');
    await admin.unsafe('grant insert on public.legacy_guard to aet_runtime');
    await expect(assertCoreConnection(runtime)).rejects.toThrow('isolation');
    await admin.unsafe('revoke insert on public.legacy_guard from aet_runtime');
    await admin.unsafe('grant select on aet.aet_documents to anon');
    await expect(activateSixTableRuntime(runtime)).rejects.toThrow('grants');
    await admin.unsafe('revoke select on aet.aet_documents from anon');
    await activateSixTableRuntime(runtime);
    expect(formalCore()).toBe(false);
  });
  it('delivers real-address confirmation and paid-result mail once using six tables', async () => {
    const a=await ready(); const transport=vi.fn().mockResolvedValue('synthetic-mail-id');
    await applicationEmail(a,'confirmation');
    expect((await flushEmails(transport,a.id))?.sent).toBe(1);
    expect(transport.mock.calls[0][0].recipient).toBe(a.email);
    const s=await paid(a.id);
    expect(m.create.mock.calls[0][0]).toMatchObject({customer_email:a.email,metadata:{pilot:'aet-2026-production'}});
    expect((await runtime`select provider_mode from aet.aet_payments where application_id=${a.id}`)[0].provider_mode).toBe('live');
    expect((await readConverged(a.id))?.payment_status).toBe('pending');
    expect((await webhook(s,env.STRIPE_TEST_WEBHOOK_SECRET)).status).toBe(400);
    expect((await webhook(s)).status).toBe(200);
    expect((await webhook(s)).status).toBe(200);
    expect((await readConverged(a.id))?.status).toBe('completed');
    expect((await flushEmails(transport,a.id))?.sent).toBe(1);
    expect((await flushEmails(transport,a.id))?.sent).toBe(0);
    expect(transport).toHaveBeenCalledTimes(2);
    expect(transport.mock.calls[1][0].recipient).toBe(a.email);
    const reader=await createCoreShadowReader(runtime);
    expect((await reader.status(a.id,{role:'customer',applicationId:a.id})).result).toBeTruthy();
    await expect(reader.status(a.id,{role:'customer',applicationId:randomUUID()})).rejects.toThrow('access_denied');
    await expect(reader.workspace({}, {role:'staff',email:'staff@example.invalid',offices:[],includeUnassigned:true})).resolves.toBeDefined();
    const inventory=await runtime`select tablename from pg_tables where schemaname='aet'`;
    expect(inventory).toHaveLength(6);
    await expect(checkout(a.id)).rejects.toThrow('already_paid');
  });
  it('reuses an open Checkout and rejects an incorrect account before creating one', async () => {
    const a=await ready();
    m.account.mockResolvedValue({id:'acct_wrong'}); await expect(checkout(a.id)).rejects.toThrow('account');
    expect(await runtime`select id from aet.aet_payments where application_id=${a.id}`).toHaveLength(0);
    m.account.mockResolvedValue({id:env.APPLICATION_CORE_PROVIDER_ACCOUNT});
    await checkout(a.id); await checkout(a.id); expect(m.create).toHaveBeenCalledTimes(1);
  });
  it('rejects mismatched amount, ownership and provider mode without publishing', async () => {
    const a=await ready();const s=await paid(a.id);
    for(const patch of [{amount_total:1},{client_reference_id:randomUUID()},{livemode:false}])
      await expect(applyCheckout({...s,...patch},randomUUID(),'checkout.session.completed')).rejects.toThrow('invalid_payment');
    await expect(applyCheckout({...s,metadata:{...s.metadata,applicationId:randomUUID()}},randomUUID(),'checkout.session.completed')).rejects.toThrow();
    expect((await readConverged(a.id))?.payment_status).toBe('pending');
    expect((await readConverged(a.id))?.saved_result.status).toBe('draft');
  });
  it('withholds refunded results even after replaying the paid callback', async () => {
    const a=await ready(),s=await paid(a.id);await applyCheckout(s,'evt_paid','checkout.session.completed');
    const charge={id:'ch_refund',livemode:true,payment_intent:s.payment_intent,currency:'usd',amount:TOTAL_CENTS,amount_refunded:TOTAL_CENTS};
    await handleStripeEvent({id:'evt_refund',livemode:true,type:'charge.refunded',data:{object:charge}} as Stripe.Event);
    await applyCheckout(s,'evt_paid','checkout.session.completed');
    expect((await readConverged(a.id))?.payment_status).toBe('refunded');
    const reader=await createCoreShadowReader(runtime);
    expect((await reader.status(a.id,{role:'customer',applicationId:a.id})).result).toBeNull();
  });
  it('ignores synthetic waivers and imported test payments in Production', async () => {
    const a=await ready();
    await runtime`update aet.aet_service_detail set amount_cents=0,details=details||'{"payment_exemption":{"scope":"synthetic-test","confirmed":true}}'::jsonb where application_id=${a.id}`;
    await publishConverged(a.id);expect((await readConverged(a.id))?.payment_status).toBe('unpaid');
    await runtime`insert into aet.aet_payments(application_id,amount_cents,payment_status,provider,provider_account,provider_mode,source)
      values (${a.id},${TOTAL_CENTS},'paid','stripe',${env.APPLICATION_CORE_PROVIDER_ACCOUNT},'test','fixture')`;
    await publishConverged(a.id);expect((await readConverged(a.id))?.payment_status).toBe('unpaid');
    expect((await readConverged(a.id))?.saved_result.status).toBe('draft');
  });
  it('does not deliver a queued notification to a stale or substituted address', async () => {
    const a=await ready();await applicationEmail(a,'confirmation');
    const [mail]=await compactNotificationRows(a.id);
    await expect(renderQueuedEmail({...mail,application_id:a.id,recipient:'other@example.invalid'})).rejects.toThrow('recipient_changed');
    await runtime`update aet.aet_core_applications set email='changed@example.invalid' where id=${a.id}`;
    const transport=vi.fn();expect((await flushEmails(transport,a.id))?.attempted).toBe(0);expect(transport).not.toHaveBeenCalled();
  });
  it('cancels an unpaid Checkout and keeps the application recoverable for staff', async () => {
    const a=await ready();await checkout(a.id);await cancelApplication(a.id,'customer');
    expect(m.expire).toHaveBeenCalledTimes(1);expect((await readConverged(a.id))?.status).toBe('cancelled');
  });
});
