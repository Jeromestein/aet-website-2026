import { beforeEach, describe, expect, it, vi } from 'vitest';
const m = vi.hoisted(() => ({ schedule: vi.fn(), authorize: vi.fn(), submit: vi.fn(), application: vi.fn(), complete: vi.fn(), retry: vi.fn(), staff: vi.fn(), pause: vi.fn(), context: vi.fn(), uploadAllowed: vi.fn(), query: vi.fn(), after: vi.fn() }));
vi.mock('server-only', () => ({}));
vi.mock('next/server', async original => ({ ...await original<typeof import('next/server')>(), after: m.after }));
vi.mock('../lib/preeval/ai-scheduler', () => ({ scheduleAI: m.schedule }));
vi.mock('../lib/preeval/ai-jobs', () => ({ completeUploads: m.complete, retryAnalysis: m.retry, pauseForUpload: m.pause }));
vi.mock('../lib/preeval/config', () => ({ configuration: () => ({}), required: () => '' }));
vi.mock('../lib/preeval/db', () => ({ db: () => m.query, table: (name: string) => name }));
vi.mock('../lib/preeval/auth', () => ({ authorize: m.authorize, consumeLink: vi.fn(), sessionCookie: () => ({ name: 'test', value: 'test' }), sameOrigin: vi.fn(), limit: vi.fn(), hash: vi.fn(), COOKIE: 'test' }));
vi.mock('../lib/preeval/email', () => ({ applicationEmail: vi.fn(), flushEmails: vi.fn() }));
vi.mock('../lib/preeval/service', () => ({ submit: m.submit, application: m.application, addFile: vi.fn(), staffAction: m.staff }));
vi.mock('../lib/preeval/payments', () => ({ checkout: vi.fn(), reconcile: vi.fn(), handleStripeEvent: vi.fn(), stripeClient: vi.fn(), cancelApplication: vi.fn() }));
vi.mock('../lib/evaluation-application/email', () => ({ flushFormalEmails: vi.fn() }));
vi.mock('../lib/evaluation-application/payments', () => ({ handleStripeEvent: vi.fn() }));
vi.mock('../lib/preeval/dropbox', () => ({ downloadFile: vi.fn() }));
vi.mock('../lib/dropbox/server', () => ({ contextFromRequest: m.context, requireUploadAllowed: m.uploadAllowed, requireEnabled: vi.fn() }));
import { GET, POST } from '../app/api/pre-evaluation/[...path]/route';
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
    expect(m.schedule).not.toHaveBeenCalled();
  });
  it.each(['', '/uploads-complete', '/retry-ai', '/staff'])('never dispatches for unauthorized access %s', async suffix => {
    m.authorize.mockRejectedValue(new AppError('unauthorized', 401));
    expect((await call(suffix ? 'POST' : 'GET', `applications/${id}${suffix}`, { action: 'retry_ai' })).status).toBe(401);
    expect(m.schedule).not.toHaveBeenCalled(); expect(m.complete).not.toHaveBeenCalled(); expect(m.retry).not.toHaveBeenCalled();
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
