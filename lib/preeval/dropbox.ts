import type { TransactionSql } from 'postgres';
import { downloadBytes } from '../dropbox/download';
import { required } from './config';
import { clientForOffice, requireEnabled } from '../dropbox/server';
import { contextFor } from '../dropbox/application';
import { resolveStorage } from '../dropbox/storage';
import { basePathFor } from '../dropbox/paths';
import { offices, safeSegment, type Office, type ApplicationKind } from '../dropbox/shared';

/** New pilot files use the same application folders as Status and CRM.
 * Original names remain in file metadata; a UUID avoids overwriting another upload.
 * Unreleased formal reports stay in a non-listed child directory. */
export async function filePath(row: Record<string, string | null>, kind: ApplicationKind, fileId: string, name: string, report = false, tx?: TransactionSql) {
  const context = contextFor(row, kind);
  const storage = await resolveStorage(context, tx);
  return `${storage.write.path}/${report ? '_reports/' : ''}${safeSegment(fileId)}-${safeSegment(name)}`;
}
export function officeForStoredPath(path: string): Office {
  const oldRoot = required('DROPBOX_LEGACY_PILOT_ROOT');
  if (oldRoot.includes('AET-PreEvaluation-Test') && path.startsWith(oldRoot + '/')) {
    path.slice(oldRoot.length + 1).split('/').forEach(safeSegment);
    return 'Miami';
  }
  for (const office of offices) {
    const prefix = `${basePathFor(office)}/${office}/`;
    if (!path.startsWith(prefix)) continue;
    const parts = path.slice(prefix.length).split('/');
    if ((parts.length !== 2 && !(parts.length === 3 && parts[1] === '_reports')) ||
      !/ - [a-f0-9]{8}(?:-[a-f0-9]{4}){3}-[a-f0-9]{12}$/i.test(parts[0])) break;
    parts.forEach(safeSegment);
    return office;
  }
  throw new Error('invalid_file_path');
}
export async function uploadFile(path: string, data: Buffer) {
  requireEnabled();
  const dbx = await clientForOffice(officeForStoredPath(path));
  return (await dbx.filesUpload({ path, contents: data, mode: { '.tag': 'overwrite' }, autorename: false, mute: true })).result;
}
/** The caller first authorizes the application/file row. Read its saved path,
 * including historical isolated-pilot paths; never rebuild it from current names. */
export async function downloadFile(path: string) {
  requireEnabled();
  const dbx = await clientForOffice(officeForStoredPath(path));
  const result = await dbx.filesDownload({ path });
  return downloadBytes(result.result);
}
