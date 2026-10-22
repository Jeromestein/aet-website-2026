import {afterEach,beforeEach,describe,expect,it,vi} from 'vitest';
import {paymentDeadline,paymentWindow} from '@/lib/customer-status/payment-window';
const m=vi.hoisted(()=>({run:vi.fn()}));
vi.mock('server-only',()=>({}));
vi.mock('@/lib/customer-status/expiry',async importOriginal=>({...await importOriginal<object>(),runPaymentExpiry:m.run}));
import {expiryConnection} from '@/lib/customer-status/expiry';
import {GET} from '@/app/api/internal/customer-status/expire/route';
const secret='synthetic-cron-secret';
beforeEach(()=>{vi.resetAllMocks();vi.stubEnv('CRON_SECRET',secret);vi.stubEnv('STATUS_EXPIRY_ENABLED','true');vi.stubEnv('VERCEL_ENV','production');m.run.mockResolvedValue({expired:2,batchFull:false});});
afterEach(()=>{vi.unstubAllEnvs();vi.restoreAllMocks();});
describe('48-hour payment window',()=>{
 it('adds elapsed hours across DST and preserves timezone offsets',()=>{expect(paymentDeadline('2026-11-01T00:30:00-04:00')).toBe('2026-11-03T04:30:00.000Z');});
 it.each(['','invalid'])('rejects missing or invalid submission time %s',value=>{expect(paymentDeadline(value)).toBeNull();});
 const record={source:'live',payment:'pending',deadline:'2026-10-17T16:29:32.000Z'};
 const end=Date.parse(record.deadline);
 it('switches at the exact deadline and respects persisted expiry',()=>{
  expect(paymentWindow(record,end-1)).toBe('pending');expect(paymentWindow(record,end)).toBe('expired');
  expect(paymentWindow({...record,payment:'expired'},end-60000)).toBe('expired');
  expect(paymentWindow({...record,payment:'expired',deadline:null},end)).toBe('expired');
 });
 it('does not show warnings for settled payments or disconnected test intakes',()=>{
  for(const payment of ['paid','failed','refunded'])expect(paymentWindow({...record,payment},end+1)).toBe('none');
  expect(paymentWindow({...record,source:'preview'},end)).toBe('none');
  expect(paymentWindow({...record,deadline:null},end)).toBe('none');
 });
});
function request(auth='Bearer '+secret){return GET(new Request('https://example.test/api/internal/customer-status/expire',{headers:{authorization:auth}}));}
describe('expiry cron authorization and activation',()=>{
 it.each(['','Bearer wrong','Bearer synthetic-cron-secreX'])('rejects %s before accessing the database',async auth=>{expect((await request(auth)).status).toBe(401);expect(m.run).not.toHaveBeenCalled();});
 it.each(['','short'])('rejects absent/weak server secret',async value=>{vi.stubEnv('CRON_SECRET',value);expect((await request('Bearer '+value)).status).toBe(401);expect(m.run).not.toHaveBeenCalled();});
 it.each([['STATUS_EXPIRY_ENABLED','false'],['STATUS_EXPIRY_ENABLED',''],['VERCEL_ENV','preview'],['VERCEL_ENV','development'],['VERCEL_ENV','']])('skips when %s=%s',async(key,value)=>{vi.stubEnv(key,value);expect(await(await request()).json()).toEqual({skipped:true});expect(m.run).not.toHaveBeenCalled();});
 it('returns only counts and disables caching',async()=>{const response=await request();expect(response.status).toBe(200);expect(response.headers.get('cache-control')).toBe('no-store');expect(await response.json()).toEqual({expired:2,batchFull:false});expect(m.run).toHaveBeenCalledTimes(1);});
 it('reports failure without exposing credentials or customer records',async()=>{const log=vi.spyOn(console,'error').mockImplementation(()=>{});m.run.mockRejectedValue(new Error('private database detail'));const response=await request();expect(response.status).toBe(503);expect(await response.json()).toEqual({error:'expiry_failed'});expect(JSON.stringify(log.mock.calls)).not.toContain('private');});
 it('rejects broad or wrong-project database credentials',()=>{
  expect(expiryConnection('postgres://aet_payment_expiry:test@db.qrxztgdemfodemlcabcq.supabase.co/postgres')).toContain('aet_payment_expiry');
  for(const url of ['postgres://postgres:test@db.qrxztgdemfodemlcabcq.supabase.co/postgres','postgres://aet_crm_runtime:test@db.qrxztgdemfodemlcabcq.supabase.co/postgres','postgres://aet_payment_expiry:test@db.other.supabase.co/postgres'])expect(()=>expiryConnection(url)).toThrow();
 });
});
