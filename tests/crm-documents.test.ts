import { beforeEach, describe, expect, it, vi } from 'vitest';
vi.mock('server-only', () => ({}));
vi.mock('@/lib/staff/session', () => ({ requireStaff: vi.fn(), requireStaffApplication: vi.fn() }));
vi.mock('@/lib/crm/live-db', () => ({ liveEnabled: vi.fn(() => true) }));
vi.mock('@/lib/crm/live-server', () => ({ liveDetail: vi.fn() }));
vi.mock('@/lib/application/intake-server', () => ({ readIntake: vi.fn(), requireIntakePreview: vi.fn() }));
vi.mock('@/lib/customer-status/model', () => ({ projectIntakeStatus: vi.fn(value => value) }));
vi.mock('@/lib/dropbox/server', () => ({ requireEnabled: vi.fn(), listFiles: vi.fn(), accountConfig: vi.fn(() => ({})), folderPath: vi.fn() }));
import { requireStaff, requireStaffApplication } from '@/lib/staff/session';
import { liveDetail } from '@/lib/crm/live-server';
import { readIntake } from '@/lib/application/intake-server';
import { listFiles } from '@/lib/dropbox/server';
import { AppError } from '@/lib/preeval/domain';
import { staffDocuments } from '@/lib/crm/documents-server';
import { GET } from '@/app/api/staff-records/[kind]/[id]/documents/route';
const id = '11111111-1111-4111-8111-111111111111';
const staff = { id: 'staff', email: 'staff@example.com', role: 'admin', staffRole: 'staff', offices: ['San Francisco'], include_unassigned: false } as const;
const row = { id, first_name: 'Test', middle_name: 'Middle', last_name: 'Person', office: 'San Francisco', email: 'Original@Example.com', submitted_at: '2026-10-20T00:00:00Z', created_at: '2026-10-20T00:00:00Z' };
beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(requireStaff).mockResolvedValue(staff as any);
  vi.mocked(requireStaffApplication).mockResolvedValue(staff as any);
  vi.mocked(liveDetail).mockResolvedValue({ row } as any);
  vi.mocked(listFiles).mockResolvedValue({ files: [], nextCursor: null });
});
describe('staff document boundaries', () => {
  it('uses authorized stored identity and forwards the folder-bound pagination cursor', async () => {
    await staffDocuments('formal', id, 'live', 'sealed-cursor');
    expect(liveDetail).toHaveBeenCalledWith('formal', id, staff);
    expect(listFiles).toHaveBeenCalledWith({ id, kind: 'evaluation', office: 'San Francisco', fullName: 'Test Middle Person', folderKey: id, submittedAt: row.submitted_at, canUpload: false }, 'sealed-cursor');
  });
  it('never contacts Dropbox for an unauthenticated or office-denied request', async () => {
    vi.mocked(requireStaff).mockRejectedValueOnce(new AppError('access_denied', 401));
    await expect(staffDocuments('formal', id, 'live')).rejects.toMatchObject({status: 401});
    vi.mocked(liveDetail).mockRejectedValueOnce(new AppError('access_denied', 403));
    await expect(staffDocuments('formal', id, 'live')).rejects.toMatchObject({status: 403});
    expect(listFiles).not.toHaveBeenCalled();
  });
  it('uses the common legacy folder rule for preview without looking up live records', async () => {
    vi.mocked(readIntake).mockResolvedValue({ id, office: 'Miami', submitted: row.submitted_at, evaluee: { first: 'Test', middle: '', last: 'Preview' } } as any);
    await staffDocuments('formal', id, 'preview');
    expect(requireStaffApplication).toHaveBeenCalledWith('formal', id, staff);
    expect(liveDetail).not.toHaveBeenCalled();
    expect(listFiles).toHaveBeenCalledWith(expect.objectContaining({ folderKey: id, office: 'Miami', fullName: 'Test Preview', canUpload: false }), undefined);
  });
  it('does not fall back to live when preview permission is denied', async () => {
    vi.mocked(requireStaffApplication).mockRejectedValueOnce(new AppError('access_denied', 403));
    await expect(staffDocuments('formal', id, 'preview')).rejects.toMatchObject({status: 403});
    expect(readIntake).not.toHaveBeenCalled(); expect(liveDetail).not.toHaveBeenCalled(); expect(listFiles).not.toHaveBeenCalled();
  });
  it('authorizes preliminary records before using their historical Miami/email folder', async () => {
    await staffDocuments('preeval', id, 'live');
    expect(liveDetail).toHaveBeenCalledWith('preeval', id, staff);
    expect(listFiles).toHaveBeenCalledWith(expect.objectContaining({ kind: 'pre-evaluation', office: 'Miami', folderKey: 'Original@Example.com' }), undefined);
  });
  it('rejects client-supplied office/path and an invalid source', async () => {
    for (const query of ['office=Miami', 'path=/other', 'source=other']) {
      const response = await GET(new Request(`http://localhost/api/staff-documents/formal/${id}?${query}`), { params: Promise.resolve({ kind: 'formal', id }) });
      expect(response.status).toBe(400);
    }
    expect(listFiles).not.toHaveBeenCalled();
  });
  it('returns no-store metadata and redacts provider errors', async () => {
    vi.mocked(listFiles).mockRejectedValueOnce(new Error('secret provider details'));
    const response = await GET(new Request(`http://localhost/api/staff-documents/formal/${id}`), { params: Promise.resolve({ kind: 'formal', id }) });
    expect(response.status).toBe(503);
    expect(response.headers.get('cache-control')).toBe('private, no-store');
    expect(await response.text()).not.toContain('secret');
  });
});
