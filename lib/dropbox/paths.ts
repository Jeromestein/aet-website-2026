import { accountForOffice, safeSegment, type Office, type ApplicationKind, DocumentError } from './shared';

export type DocumentIdentity = {
  id: string; kind: ApplicationKind; office: Office; fullName: string;
  folderKey: string; submittedAt: string; legacyFolderKey?: string; canUpload?: boolean;
};
export type Location = { office: Office; path: string };
export type DocumentStorage = { write: Location; reads: Location[]; archivePath: string | null };
export const basePathFor = (office: Office) => accountForOffice(office) === 'AET_App' ? '/Team Files/WebsitesDev' : '/WebsitesDev';
export const archiveRoot = '/Team Files/AET ALL Offices/AET Services/2-Foreign Credential Evaluation';
const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
export function applicationFolder(context: DocumentIdentity) {
  safeSegment(context.id);
  if (!/^[a-f0-9]{8}(?:-[a-f0-9]{4}){3}-[a-f0-9]{12}$/i.test(context.id)) throw new DocumentError('invalid');
  return `${basePathFor(context.office)}/${context.office}/${safeSegment(`${context.fullName} - ${context.id}`)}`;
}
export function initialStorage(context: DocumentIdentity): DocumentStorage {
  const write = { office: context.office, path: applicationFolder(context) };
  const reads = [write];
  if (context.kind === 'pre-evaluation' && context.legacyFolderKey) {
    reads.push({ office: 'Miami', path: `${basePathFor('Miami')}/Miami/${safeSegment(`${context.fullName} - ${context.legacyFolderKey}`)}` });
  }
  let archivePath = null;
  if (context.office === 'Los Angeles') {
    const date = /^(\d{4})-(\d{2})-\d{2}/.exec(context.submittedAt);
    if (!date || !months[Number(date[2]) - 1]) throw new DocumentError('invalid');
    archivePath = `${archiveRoot}/${date[1]}/${months[Number(date[2]) - 1]}/${safeSegment(`${context.fullName} - ${context.id}`)}`;
  }
  return { write, reads, archivePath };
}
export function validateStorage(storage: DocumentStorage, id: string) {
  for (const location of [storage.write, ...storage.reads]) {
    const prefix = `${basePathFor(location.office)}/${location.office}/`;
    if (!location.path.startsWith(prefix)) throw new DocumentError('access', 403);
    safeSegment(location.path.slice(prefix.length));
  }
  if (!storage.write.path.endsWith(` - ${id}`) || !storage.reads.some(r => r.path === storage.write.path && r.office === storage.write.office)) throw new DocumentError('access', 403);
  return storage;
}
