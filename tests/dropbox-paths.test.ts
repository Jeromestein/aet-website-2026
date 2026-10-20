import { beforeEach, describe, expect, it, vi } from 'vitest';
import { initialStorage, applicationFolder, validateStorage, type DocumentIdentity } from '../lib/dropbox/paths';
vi.mock('server-only', () => ({}));
const { records, sql } = vi.hoisted(() => {
  const records = new Map<string, unknown>();
  const sql: any = async (parts: TemplateStringsArray, ...values: any[]) => {
    const key = values[1] + ':' + values[2];
    if (parts.join('').startsWith('insert')) {
      if (!records.has(key)) records.set(key, values[3]);
      return [];
    }
    return records.has(key) ? [{ storage: records.get(key) }] : [];
  };
  sql.json = (data: unknown) => data;
  return { records, sql };
});
vi.mock('../lib/preeval/db', () => ({ db: () => sql, table: (name: string) => name }));
import { resolveStorage } from '../lib/dropbox/storage';
const identity: DocumentIdentity = { id: '00000000-0000-4000-8000-000000000001', kind: 'pre-evaluation', office: 'Miami', fullName: 'Jane Doe', folderKey: 'ignored@example.test', submittedAt: '2026-10-20T00:00:00Z' };
beforeEach(() => records.clear());
describe('Application storage identity', () => {
  it('uses application ID for both services even with an old folderKey', () => {
    expect(applicationFolder(identity)).toBe('/Team Files/WebsitesDev/Miami/Jane Doe - ' + identity.id);
    expect(applicationFolder({ ...identity, kind: 'evaluation' })).toBe(applicationFolder(identity));
  });
  it('retains explicit email history without writing new files there', () => {
    const storage = initialStorage({ ...identity, legacyFolderKey: 'Case.Email@example.test' });
    expect(storage.reads).toHaveLength(2);
    expect(storage.reads[1].path).toContain('Jane Doe - Case.Email@example.test');
    expect(storage.write.path).toContain(identity.id);
  });
  it('new application has no email fallback and cannot inherit shared old files', async () => {
    await resolveStorage(identity);
    const resolved = await resolveStorage({ ...identity, legacyFolderKey: 'Case.Email@example.test' });
    expect(resolved.reads).toHaveLength(1);
  });
  it('pins path, account and archive date across profile edits', async () => {
    const first = await resolveStorage({ ...identity, kind: 'evaluation', office: 'Los Angeles' });
    const later = await resolveStorage({ ...identity, kind: 'evaluation', office: 'Boston', fullName: 'Changed', submittedAt: '2027-01-02' });
    expect(later).toEqual(first);
    expect(later.archivePath).toContain('/2026/October/Jane Doe - ');
  });
  it('selects a single location when initialization races', async () => {
    const locations = await Promise.all(['First', 'Second', 'Third'].map(fullName => resolveStorage({ ...identity, fullName })));
    expect(locations.every(location => JSON.stringify(location) === JSON.stringify(locations[0]))).toBe(true);
  });
  it('keeps repeated applications distinct', async () => {
    const first = await resolveStorage(identity);
    const second = await resolveStorage({ ...identity, id: '00000000-0000-4000-8000-000000000002' });
    expect(first.write.path).not.toBe(second.write.path);
  });
  it('retains both office account roots', () => {
    expect(applicationFolder({ ...identity, office: 'Boston' })).toMatch(/^\/WebsitesDev\/Boston\//);
    expect(applicationFolder({ ...identity, office: 'San Francisco' })).toMatch(/^\/Team Files\/WebsitesDev\/San Francisco\//);
  });
  it('rejects unsafe folder names and foreign mappings', () => {
    expect(() => applicationFolder({ ...identity, fullName: '../Someone' })).toThrow();
    expect(() => applicationFolder({ ...identity, id: '../Other' })).toThrow();
    const storage = initialStorage(identity);
    expect(() => validateStorage({ ...storage, write: { ...storage.write, path: '/other' } }, identity.id)).toThrow();
    expect(() => validateStorage(storage, 'other-id')).toThrow();
  });
});
