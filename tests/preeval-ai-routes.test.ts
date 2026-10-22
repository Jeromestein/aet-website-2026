import { beforeEach, describe, expect, it, vi } from 'vitest';
const m = vi.hoisted(() => ({ abandon: vi.fn(), unfinished: vi.fn(), origin: vi.fn(), schedule: vi.fn(), authorize: vi.fn(), submit: vi.fn(), application: vi.fn(), complete: vi.fn(), retry: vi.fn(), staff: vi.fn(), pause: vi.fn(), context: vi.fn(), uploadAllowed: vi.fn(), query: vi.fn(), after: vi.fn(), mail: vi.fn(), cloudPreview: false, construct: vi.fn(), paymentEvent: vi.fn(), formalEvent: vi.fn(), formalMail: vi.fn() }));
vi.mock('server-only', () => ({}));
vi.mock('next/server', async original => ({ ...await original<typeof import('next/server')>(), after: m.after }));
vi.mock('../lib/preeval/upload-recovery', () => ({ abandonUpload: m.abandon, unfinishedUploads: m.unfinished }));
vi.mock('../lib/preeval/ai-scheduler', () => ({ scheduleAI: m.schedule }));
vi.mock('../lib/preeval/ai-jobs', () => ({ completeUploads: m.complete, retryAnalysis: m.retry, pauseForUpload: m.pause }));
vi.mock('../lib/preeval/config', () => ({ configuration: () => ({ cloudPreview: m.cloudPreview }), required: () => '' }));
vi.mock('../lib/preeval/db', () => ({ db: () => m.query, table: (name: string) => name }));
vi.mock('../lib/preeval/auth', () => ({ authorize: m.authorize, consumeLink: vi.fn(), sessionCookie: () => ({ name: 'test', value: 'test' }), sameOrigin: m.origin, limit: vi.fn(), hash: vi.fn(), COOKIE: 'test' }));
vi.mock('../lib/preeval/email', () => ({ applicationEmail: vi.fn(), cloudPreview: false, construct: vi.fn(), paymentEvent: vi.fn(), formalEvent: vi.fn(), formalMail: vi.fn(), deliverApplicationEmails: m.mail }));
vi.mock('../lib/preeval/service', () => ({ submit: m.submit, application: m.application, addFile: vi.fn(), staffAction: m.staff }));
vi.mock('../lib/preeval/payments', () => ({ checkout: vi.fn(), reconcile: vi.fn(), handleStripeEvent: m.paymentEvent, stripeClient: () => ({ webhooks: { constructEvent: m.construct } }), cancelApplication: vi.fn() }));
vi.mock('../lib/evaluation-application/email', () => ({ flushFormalEmails: m.formalMail }));
vi.mock('../lib/evaluation-application/payments', () => ({ handleStripeEvent: m.formalEvent }));
vi.mock('../lib/preeval/dropbox', () => ({ downloadFile: vi.fn() }));
vi.mock('../lib/dropbox/server', () => ({ contextFromRequest: m.context, requireUploadAllowed: m.uploadAllowed, requireEnabled: vi.fn() }));
import { GET, POST } from '../app/api/pre-evaluation/[...path]/route';
import { GET as recoveryList, POST as recoveryDiscard } from '../app/api/dropbox/upload-recovery/route';
import { POST as batch } from '../app/api/dropbox/upload-batch/route';
import { AppError } from '../lib/preeval/domain';
import { DocumentError } from '../lib/dropbox/shared';
const id = '10000000-0000-4000-8000-000000000001';
const origin = 'http://localhost:3022';
function request(method: string, path: string, body = {}) {
  return new Request(origin + '/api/' + path, { method, headers: { Origin: origin, 'Content-Type': 'application/json' }, ...(method === 'POST' ? { body: JSON.stringify(body) } : {}) });
}
function call(method: 'GET' | 'POST', path: string, body = {}) {
  return (method === 'GET' ? GET : POST)(request(method, 'pre-evaluation/' + path, body), { params: Promise.resolve({ path: path.split('/') }) });
}
beforeEach(() => {
  vi.resetAllMocks();
  m.cloudPreview = false;
  m.authorize.mockResolvedValue({ role: 'customer', email: 'synthetic@example.invalid' });
  m.submit.mockResolvedValue({ app: { id, locale: 'en' }, token: 'test' });
  m.application.mockResolvedValue({ ai_status: 'queued' });
  m.context.mockReturnValue({ data: { kind: 'pre-evaluation', id } });
  m.query.mockResolvedValue([{ id }]);
});
describe('application dispatch boundaries', () => {
  it('schedules a successfully saved submission', async () => {
    expect((await call('POST', 'applications')).status).toBe(201);
    expect(m.schedule).toHaveBeenCalledWith(id);
    await m.after.mock.calls[0][0](); expect(m.mail).toHaveBeenCalledWith(id);
    expect(m.submit.mock.invocationCallOrder[0]).toBeLessThan(m.schedule.mock.invocationCallOrder[0]);
  });
  it('does not schedule a rejected submission', async () => {
    m.submit.mockRejectedValue(new AppError('invalid_request'));
    expect((await call('POST', 'applications')).status).toBe(400);
    expect(m.schedule).not.toHaveBeenCalled();
  });
  it.each(['uploads-complete', 'retry-ai'])('schedules only after %s succeeds', async action => {
    const operation = action === 'retry-ai' ? m.retry : m.complete;
    expect((await call('POST', `applications/${id}/${action}`)).status).toBe(200);
    expect(m.schedule).toHaveBeenCalledWith(id);
    expect(operation.mock.invocationCallOrder[0]).toBeLessThan(m.schedule.mock.invocationCallOrder[0]);
    m.schedule.mockClear(); operation.mockRejectedValueOnce(new AppError('uploads_incomplete', 409));
    expect((await call('POST', `applications/${id}/${action}`)).status).toBe(409);
    expect(m.schedule).not.toHaveBeenCalled();
  });
  it.each(['queued', 'running'])('attempts recovery for authorized %s reads', async ai_status => {
    m.application.mockResolvedValue({ ai_status });
    expect((await call('GET', `applications/${id}`)).status).toBe(200);
    expect(m.schedule).toHaveBeenCalledWith(id);
    expect(m.authorize.mock.invocationCallOrder[0]).toBeLessThan(m.schedule.mock.invocationCallOrder[0]);
  });
  it.each(['idle', 'completed', 'failed'])('does not auto-retry %s reads', async ai_status => {
    m.application.mockResolvedValue({ ai_status });
    expect((await call('GET', `applications/${id}`)).status).toBe(200);
    expect(m.authorize.mock.invocationCallOrder[0]).toBeLessThan(m.application.mock.invocationCallOrder[0]);
    expect(m.schedule).not.toHaveBeenCalled();
    await m.after.mock.calls[0][0](); expect(m.mail).toHaveBeenCalledWith(id);
  });
  it.each(['', '/uploads-complete', '/retry-ai', '/staff'])('never dispatches for unauthorized access %s', async suffix => {
    m.authorize.mockRejectedValue(new AppError('unauthorized', 401));
    expect((await call(suffix ? 'POST' : 'GET', `applications/${id}${suffix}`, { action: 'retry_ai' })).status).toBe(401);
    expect(m.application).not.toHaveBeenCalled();
    expect(m.schedule).not.toHaveBeenCalled(); expect(m.complete).not.toHaveBeenCalled(); expect(m.retry).not.toHaveBeenCalled(); expect(m.after).not.toHaveBeenCalled();
  });
  it('requires the staff grant before regeneration', async () => {
    m.authorize.mockResolvedValueOnce({ role: 'customer' }).mockRejectedValueOnce(new AppError('forbidden', 403));
    expect((await call('POST', `applications/${id}/staff`, { action: 'retry_ai' })).status).toBe(403);
    expect(m.staff).not.toHaveBeenCalled(); expect(m.schedule).not.toHaveBeenCalled();
  });
  it('regenerates after authorized staff retry but never after a manual correction', async () => {
    m.authorize.mockResolvedValue({ role: 'admin', email: 'staff@example.invalid' });
    expect((await call('POST', `applications/${id}/staff`, { action: 'retry_ai' })).status).toBe(200);
    expect(m.schedule).toHaveBeenCalledWith(id);
    m.schedule.mockClear();
    expect((await call('POST', `applications/${id}/staff`, { action: 'result' })).status).toBe(200);
    expect(m.schedule).not.toHaveBeenCalled();
  });
});
describe('shared Dropbox batch dispatch', () => {
  it('schedules pre-evaluation only after batch completion', async () => {
    expect((await batch(request('POST', 'dropbox/upload-batch', { action: 'complete' }))).status).toBe(200);
    expect(m.schedule).toHaveBeenCalledWith(id);
    expect(m.complete.mock.invocationCallOrder[0]).toBeLessThan(m.schedule.mock.invocationCallOrder[0]);
  });
  it('pauses without dispatch when a batch starts', async () => {
    expect((await batch(request('POST', 'dropbox/upload-batch', { action: 'start' }))).status).toBe(200);
    expect(m.pause).toHaveBeenCalledWith(id); expect(m.schedule).not.toHaveBeenCalled();
  });
  it('does not send FCE files into AI analysis', async () => {
    m.context.mockReturnValue({ data: { kind: 'evaluation', id } });
    expect((await batch(request('POST', 'dropbox/upload-batch', { action: 'complete' }))).status).toBe(200);
    expect(m.complete).not.toHaveBeenCalled(); expect(m.schedule).not.toHaveBeenCalled();
  });
  it('preserves historical-only applications without creating new AI work', async () => {
    m.query.mockResolvedValue([]);
    expect((await batch(request('POST', 'dropbox/upload-batch', { action: 'complete' }))).status).toBe(200);
    expect(m.schedule).not.toHaveBeenCalled();
  });
  it('rejects cross-origin or unauthorized batches before scheduling', async () => {
    const outside = new Request(origin + '/api/dropbox/upload-batch', { method: 'POST', headers: { Origin: 'https://outside.invalid', 'Content-Type': 'application/json' }, body: '{"action":"complete"}' });
    expect((await batch(outside)).status).toBe(403);
    m.uploadAllowed.mockImplementation(() => { throw new DocumentError('access', 403); });
    expect((await batch(request('POST', 'dropbox/upload-batch', { action: 'complete' }))).status).toBe(403);
    expect(m.schedule).not.toHaveBeenCalled();
  });
  it('never schedules an incomplete batch', async () => {
    m.complete.mockRejectedValue(new AppError('uploads_incomplete', 409));
    expect((await batch(request('POST', 'dropbox/upload-batch', { action: 'complete' }))).status).toBe(502);
    expect(m.schedule).not.toHaveBeenCalled();
  });
});


describe('signed Stripe callback dispatch', () => {
  const event = { id: 'evt_synthetic', livemode: false, type: 'checkout.session.completed', data: { object: { metadata: { pilot: 'aet-2026-local', applicationId: id } } } };
  const callback = (signature = 'test-signature') => POST(new Request(origin + '/api/pre-evaluation/stripe-webhook', {
    method: 'POST', body: '{"signed":"body"}', headers: { 'stripe-signature': signature },
  }), { params: Promise.resolve({ path: ['stripe-webhook'] }) });
  it('dispatches only pre-evaluation and its scoped mail in cloud preview', async () => {
    m.cloudPreview = true; m.construct.mockReturnValue(event);
    expect((await callback()).status).toBe(200);
    expect(m.paymentEvent).toHaveBeenCalledWith(event);
    expect(m.formalEvent).not.toHaveBeenCalled(); expect(m.formalMail).not.toHaveBeenCalled();
    expect(m.after).toHaveBeenCalledTimes(1);
    await m.after.mock.calls[0][0](); expect(m.mail).toHaveBeenCalledWith(id);
    expect(Buffer.from(m.construct.mock.calls[0][0]).toString()).toBe('{"signed":"body"}');
  });
  it('preserves the local combined handler', async () => {
    m.construct.mockReturnValue(event);
    expect((await callback()).status).toBe(200);
    expect(m.formalEvent).toHaveBeenCalledWith(event);
    expect(m.after).toHaveBeenCalledWith(m.formalMail);
  });
  it.each(['', 'incorrect'])('rejects a missing or invalid signature (%s)', async signature => {
    m.construct.mockImplementation(() => { throw new Error('bad signature'); });
    expect((await callback(signature)).status).toBe(400);
    expect(m.paymentEvent).not.toHaveBeenCalled(); expect(m.after).not.toHaveBeenCalled();
  });
  it('does not schedule email when event processing fails', async () => {
    m.construct.mockReturnValue(event); m.paymentEvent.mockRejectedValue(new AppError('invalid_payment'));
    expect((await callback()).status).toBe(400); expect(m.after).not.toHaveBeenCalled();
  });
});


describe('upload recovery authorization boundaries', () => {
  const selected = { source: 'document', id, version: id };
  it('authorizes customer recovery reads and writes before querying attempts', async () => {
    m.unfinished.mockResolvedValue({ uploads: [] }); m.abandon.mockResolvedValue({ removed: true });
    expect((await call('GET', `applications/${id}/upload-recovery`)).status).toBe(200);
    expect((await call('POST', `applications/${id}/upload-recovery`, selected)).status).toBe(200);
    expect(m.abandon).toHaveBeenCalledWith(id, selected, 'synthetic@example.invalid');
    expect(m.schedule).not.toHaveBeenCalled();
    m.abandon.mockClear(); m.unfinished.mockClear();
    m.authorize.mockRejectedValue(new AppError('access_denied', 403));
    expect((await call('GET', `applications/${id}/upload-recovery`)).status).toBe(403);
    expect((await call('POST', `applications/${id}/upload-recovery`, selected)).status).toBe(403);
    expect(m.abandon).not.toHaveBeenCalled(); expect(m.unfinished).not.toHaveBeenCalled();
  });
  it('rejects cross-origin customer discard before changing an upload', async () => {
    m.origin.mockImplementation(() => { throw new AppError('access_denied', 403); });
    expect((await call('POST', `applications/${id}/upload-recovery`, selected)).status).toBe(403);
    expect(m.abandon).not.toHaveBeenCalled();
  });
  it('binds shared discard to the authorized context, ignoring body application IDs', async () => {
    m.abandon.mockResolvedValue({ removed: true });
    expect((await recoveryDiscard(request('POST', 'dropbox/upload-recovery', { ...selected, applicationId: 'foreign' }))).status).toBe(200);
    expect(m.abandon.mock.calls[0][0]).toBe(id);
    m.abandon.mockRejectedValue(new AppError('upload_expired', 409));
    expect((await recoveryDiscard(request('POST', 'dropbox/upload-recovery', selected))).status).toBe(409);
  });
  it('rejects shared read-only and forged contexts and cross-origin writes', async () => {
    m.uploadAllowed.mockImplementation(() => { throw new DocumentError('readOnly', 403); });
    expect((await recoveryDiscard(request('POST', 'dropbox/upload-recovery', selected))).status).toBe(403);
    m.uploadAllowed.mockReset();
    const foreign = new Request(origin + '/api/dropbox/upload-recovery', { method: 'POST', headers: { Origin: 'http://foreign.invalid', 'Content-Type': 'application/json' }, body: JSON.stringify(selected) });
    expect((await recoveryDiscard(foreign)).status).toBe(403);
    m.context.mockImplementation(() => { throw new DocumentError('access', 401); });
    expect((await recoveryList(request('GET', 'dropbox/upload-recovery'))).status).toBe(401);
    expect(m.abandon).not.toHaveBeenCalled(); expect(m.unfinished).not.toHaveBeenCalled();
  });
  it('does not add recovery writes or queries to formal evaluation documents', async () => {
    m.context.mockReturnValue({ data: { kind: 'evaluation', id } });
    expect(await (await recoveryList(request('GET', 'dropbox/upload-recovery'))).json()).toMatchObject({ uploads: [], pending: false });
    expect((await recoveryDiscard(request('POST', 'dropbox/upload-recovery', selected))).status).toBe(400);
    expect(m.abandon).not.toHaveBeenCalled(); expect(m.unfinished).not.toHaveBeenCalled();
  });
});
