import { beforeEach, describe, expect, it, vi } from 'vitest';
const m = vi.hoisted(() => ({ staff: vi.fn(), scope: vi.fn(), read: vi.fn(), query: vi.fn(), compact: true }));
vi.mock('server-only', () => ({}));
vi.mock('../lib/application-release', () => ({ applicationUnavailableResponse: () => null }));
vi.mock('../lib/staff/session', () => ({ staffSession: m.staff, requireStaffApplication: m.scope }));
vi.mock('../lib/preeval/db', () => ({ db: () => m.query, table: (name: string) => name }));
vi.mock('../lib/preeval/config', () => ({ configuration: () => ({ origin: 'http://localhost:3021' }), required: () => '' }));
vi.mock('../lib/application-core/formal-store', () => ({ formalCore: () => m.compact, readFormal: m.read }));
vi.mock('../lib/application-core/compact-files', () => ({ compact: () => m.compact }));
vi.mock('../lib/application-core/connection', () => ({ coreTable: (_: unknown, name: string) => name }));
vi.mock('../lib/application-core/formal-actions', () => ({ addFormalFile: vi.fn(), formalStaffAction: vi.fn() }));
import { access, staffAccess, makeAccessLink } from '../lib/evaluation-application/service';
import { authorize, session } from '../lib/preeval/auth';
import { AppError } from '../lib/preeval/domain';
import { POST as formalRoute } from '../app/api/evaluation/[...path]/route';
import { POST as retiredSubmission } from '../app/api/evaluation/applications/route';
const id = '10000000-0000-4000-8000-000000000001';
beforeEach(() => {
  vi.resetAllMocks(); m.compact = true; m.staff.mockResolvedValue(null);
  m.read.mockResolvedValue({ id, locale: 'zh', data: { intakeVersion: 2 } });
  m.query.mockResolvedValue([{ id, email: 'synthetic@example.invalid' }]);
});
describe('customer access without browser sessions', () => {
  it('uses a reusable formal link with no expiry and no credential write', async () => {
    expect(await access(id)).toEqual({ admin: false, actor: 'customer' });
    const first = await makeAccessLink(id, 'staff@example.invalid');
    vi.useFakeTimers();
    try {
      vi.setSystemTime(new Date('2036-01-01'));
      expect(await makeAccessLink(id, 'staff@example.invalid')).toBe(first);
      expect(first).toContain(id); expect(first).not.toContain('token');
      expect(m.query).not.toHaveBeenCalled();
    } finally { vi.useRealTimers(); }
  });
  it('rejects retired formal exchange and submission without database writes or cookies', async () => {
    const request = new Request('http://localhost:3021/api/evaluation/access/consume', {
      method: 'POST', headers: { origin: 'http://localhost:3021', 'content-type': 'application/json' },
      body: JSON.stringify({ token: 'retired-customer-token' }),
    });
    const responses = [await formalRoute(request, { params: Promise.resolve({ path: ['access', 'consume'] }) }), await retiredSubmission()];
    for (const response of responses) {
      expect(response.status).toBe(410);
      expect(await response.json()).toEqual({ error: 'legacy_customer_access_retired' });
      expect(response.headers.get('set-cookie')).toBeNull();
    }
    expect(m.query).not.toHaveBeenCalled(); expect(m.staff).not.toHaveBeenCalled();
  });
  it('keeps customer links out of staff actions', async () => {
    await expect(staffAccess(id)).rejects.toMatchObject({ status: 401 });
    await expect(authorize()).rejects.toMatchObject({ status: 401 });
    expect(await session()).toBeNull();
  });
  it('does not grant customer access to legacy formal records', async () => {
    m.compact = false;
    await expect(access(id)).rejects.toMatchObject({ status: 401 });
    await expect(makeAccessLink(id, 'staff@example.invalid')).rejects.toMatchObject({ status: 410 });
    expect(m.read).not.toHaveBeenCalled(); expect(m.query).not.toHaveBeenCalled();
  });
  it('retains office authorization for both services, including legacy staff reads', async () => {
    m.staff.mockResolvedValue({ role: 'admin', email: 'staff@example.invalid', offices: ['Miami'] });
    m.scope.mockRejectedValue(new AppError('access_denied', 403));
    for (const compact of [true, false]) {
      m.compact = compact;
      await expect(access(id)).rejects.toMatchObject({ status: 403 });
      await expect(authorize(id)).rejects.toMatchObject({ status: 403 });
    }
    expect(m.scope).toHaveBeenCalledWith('formal', id);
    expect(m.scope).toHaveBeenCalledWith('preeval', id);
    expect(m.read).not.toHaveBeenCalled();
  });
  it('rejects missing or malformed formal applications', async () => {
    await expect(access('invalid')).rejects.toMatchObject({ status: 404 });
    m.read.mockRejectedValue(new AppError('not_found', 404));
    await expect(access(id)).rejects.toMatchObject({ status: 404 });
  });
});
