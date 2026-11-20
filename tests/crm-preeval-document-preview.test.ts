import { beforeEach, expect, it, vi } from 'vitest';
import { AppError } from '@/lib/preeval/domain';
import { GET } from '@/app/api/pre-evaluation/[...path]/route';

const mocks = vi.hoisted(() => ({
  staff: vi.fn(), query: vi.fn(), preview: vi.fn(), compact: vi.fn(), isCore: vi.fn(), stored: vi.fn(),
}));
vi.mock('server-only', () => ({}));
vi.mock('@/lib/application-release', () => ({applicationUnavailableResponse: () => null}));
vi.mock('@/lib/preeval/config', () => ({configuration: () => ({})}));
vi.mock('@/lib/staff/session', () => ({requireStaffApplication: mocks.staff}));
vi.mock('@/lib/preeval/db', () => ({db: () => mocks.query, table: (name: string) => name}));
vi.mock('@/lib/crm/document-preview', () => ({staffDocumentPreview: mocks.preview}));
vi.mock('@/lib/application-core/compact-files', () => ({compact: mocks.compact}));
vi.mock('@/lib/application-core/connection', () => ({coreTable: (_: unknown, name: string) => name}));
vi.mock('@/lib/application-core/runtime', () => ({isCoreApplication: mocks.isCore}));
vi.mock('@/lib/application-core/documents', () => ({coreSupportingFile: mocks.stored}));

const app = '11111111-1111-4111-8111-111111111111';
const file = '22222222-2222-4222-8222-222222222222';
function get() {
  const path = ['applications', app, 'admin', 'documents', file];
  return GET(new Request('http://localhost/api/pre-evaluation/' + path.join('/')), {params: Promise.resolve({path})});
}
beforeEach(() => {
  vi.resetAllMocks();
  mocks.compact.mockReturnValue(true);
  mocks.preview.mockResolvedValue({previewUrl:'https://www.dropbox.com/preview/sample.pdf', uploadedAt:'2026-11-20T16:46:00Z'});
});

it('resolves the ready supporting file on the authorized pre-evaluation', async () => {
  const stored = {storage_location:'AET_App', storage_file_id:'id:sample'};
  mocks.query.mockImplementation((sql: TemplateStringsArray, ...args: unknown[]) => {
    expect(args.slice(-2)).toEqual([app, file]);
    expect(sql.join('')).toContain("a.primary_service='pre-evaluation'");
    expect(sql.join('')).toContain("d.access_scope='customer_input' and d.upload_state='ready'");
    return [stored];
  });
  expect((await get()).status).toBe(200);
  expect(mocks.staff).toHaveBeenCalledWith('preeval', app);
  expect(mocks.preview).toHaveBeenCalledWith(stored, true);
});
it.each([401, 403])('requires staff access to this office (%s)', async status => {
  mocks.staff.mockRejectedValue(new AppError('access_denied', status));
  expect((await get()).status).toBe(status);
  expect(mocks.query).not.toHaveBeenCalled();
  expect(mocks.preview).not.toHaveBeenCalled();
});
it('skips Dropbox when the requested file is absent', async () => {
  mocks.query.mockResolvedValue([]);
  expect((await get()).status).toBe(404);
  expect(mocks.preview).not.toHaveBeenCalled();
});
it.each([true, false])('uses the appropriate stored locator for older records (core=%s)', async core => {
  mocks.compact.mockReturnValue(false);
  mocks.isCore.mockResolvedValue(core);
  const legacy = {dropbox_path:'/saved/path.pdf'};
  const indexed = {storage_file_id:'id:sample', storage_location:'AET_App'};
  mocks.query.mockResolvedValue([legacy]);
  mocks.stored.mockResolvedValue(indexed);
  expect((await get()).status).toBe(200);
  expect(mocks.preview).toHaveBeenCalledWith(core ? indexed : legacy, core);
});
