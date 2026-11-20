import { beforeEach, expect, it, vi } from 'vitest';
import { AppError } from '@/lib/preeval/domain';
import { GET } from '@/app/api/evaluation/[...path]/route';

const mocks = vi.hoisted(() => ({ staff: vi.fn(), query: vi.fn(), metadata: vi.fn() }));
vi.mock('server-only', () => ({}));
vi.mock('@/lib/application-release', () => ({ applicationUnavailableResponse: () => null }));
vi.mock('@/lib/preeval/config', () => ({ configuration: () => ({}) }));
vi.mock('@/lib/preeval/db', () => ({ db: () => mocks.query }));
vi.mock('@/lib/evaluation-application/service', () => ({ staffAccess: mocks.staff }));
vi.mock('@/lib/application-core/formal-store', () => ({
  formalCore: () => true, formalFiles: () => 'files', formalRows: () => 'applications',
}));
vi.mock('@/lib/application-core/documents', () => ({ coreFileMetadata: mocks.metadata }));
vi.mock('@/lib/dropbox/server', () => ({ requireEnabled: () => {} }));

const application = '11111111-1111-4111-8111-111111111111';
const document = '22222222-2222-4222-8222-222222222222';
function getDetails() {
  const path = ['applications', application, 'admin', 'documents', document];
  return GET(new Request('http://localhost/api/evaluation/' + path.join('/')), { params: Promise.resolve({ path }) });
}
beforeEach(() => {
  vi.resetAllMocks();
  mocks.staff.mockResolvedValue({admin: true});
  mocks.query.mockImplementation(() => []);
});

it('returns the current Dropbox path and provider timestamp for the authorized file', async () => {
  const file = {id: document, storage_file_id: 'id:stable'};
  mocks.query.mockImplementation((parts: TemplateStringsArray, ...values: unknown[]) => {
    if (!parts.join('').includes("kind='document' and state='ready'")) return [];
    expect(values.slice(-2)).toEqual([application, document]);
    return [file];
  });
  mocks.metadata.mockResolvedValue({'.tag': 'file', path_display: '/Moved/Transcripts #2.pdf', server_modified: '2026-11-20T16:46:00Z'});
  const result = await getDetails();
  expect(result.status).toBe(200);
  expect(await result.json()).toEqual({previewUrl: 'https://www.dropbox.com/preview/Moved/Transcripts%20%232.pdf', uploadedAt: '2026-11-20T16:46:00Z'});
  expect(mocks.staff).toHaveBeenCalledWith(application);
  expect(mocks.metadata).toHaveBeenCalledWith(file);
});

it('requires staff office access before reading a file', async () => {
  mocks.staff.mockRejectedValue(new AppError('access_denied',403));
  expect((await getDetails()).status).toBe(403);
  expect(mocks.query).not.toHaveBeenCalled();
  expect(mocks.metadata).not.toHaveBeenCalled();
});

it('does not resolve metadata for an unrelated or unavailable document', async () => {
  expect((await getDetails()).status).toBe(404);
  expect(mocks.metadata).not.toHaveBeenCalled();
});
