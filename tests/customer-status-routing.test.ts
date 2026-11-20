import { beforeEach, expect, it, vi } from 'vitest';
import { POST } from '@/app/api/customer-status/route';
import LegacyStatusPage from '@/app/[locale]/status-check/page';
import { AppError } from '@/lib/preeval/domain';

const mocks = vi.hoisted(() => ({
  query: vi.fn(), readLegacy: vi.fn(), checkOrigin: vi.fn(), limit: vi.fn(),
}));
vi.mock('server-only', () => ({}));
vi.mock('@/lib/preeval/auth', () => ({ sameOrigin: mocks.checkOrigin, limit: mocks.limit }));
vi.mock('@/lib/application-release', () => ({ applicationUnavailableResponse: () => null }));
vi.mock('@/lib/application-page-access', () => ({requireApplicationPage: () => {}}));
vi.mock('@/lib/application-core/compact-files', () => ({ compact: () => true }));
vi.mock('@/lib/preeval/db', () => ({db: () => mocks.query}));
vi.mock('@/lib/application-core/connection', () => ({coreTable: () => 'applications'}));
vi.mock('@/lib/application-core/formal-store', () => ({formalCore: () => true, formalLegacy: mocks.readLegacy}));
vi.mock('@/lib/crm/live-db', () => ({liveEnabled: () => false}));

const id = 'eeeeeeee-2354-4abc-8def-123456789000';
function check(applicationId: string) {
  return POST(new Request('http://localhost/api/customer-status', {
    method: 'POST', headers: {origin: 'http://localhost'}, body: JSON.stringify({ applicationId }),
  }));
}
beforeEach(() => { vi.resetAllMocks(); });

it('routes a saved pre-evaluation ID without returning a result or formal application data', async () => {
  mocks.query.mockResolvedValue([{primary_service:'pre-evaluation',submission_version:1}]);
  const res = await check(id.toUpperCase());
  expect(res.status).toBe(200);
  expect(await res.json()).toEqual({kind:'pre-evaluation', id});
  expect(mocks.readLegacy).not.toHaveBeenCalled();
  expect(mocks.checkOrigin).toHaveBeenCalledOnce();
});

it('keeps the formal fallback for an ID absent from the new application table', async () => {
  mocks.query.mockResolvedValue([]);
  mocks.readLegacy.mockRejectedValue(new AppError('not_found',404));
  expect((await check(id)).status).toBe(404);
  expect(mocks.readLegacy).toHaveBeenCalledWith(id);
});

it('rejects incomplete IDs before selecting a workflow', async () => {
  expect((await check('123')).status).toBe(400);
  expect(mocks.query).not.toHaveBeenCalled();
});

it.each([['en',''],['zh','/zh'],['es','/es']])('redirects old %s result links with checkout and upload state',async(locale,prefix)=>{
  const query={applicationId:id,checkout:'cancelled',upload:'retry',unused:'discard'};
  await expect(LegacyStatusPage({params:Promise.resolve({locale}),searchParams:Promise.resolve(query)}))
    .rejects.toMatchObject({digest:`NEXT_REDIRECT;replace;${prefix}/status?applicationId=${id}&checkout=cancelled&upload=retry;307;`});
});
