import 'server-only';
import type { TransactionSql } from 'postgres';
import { db, type Row } from '../preeval/db';
import { AppError } from '../preeval/domain';
import { clientForOffice, requireEnabled } from '../dropbox/server';
import { basePathFor } from '../dropbox/paths';
import { safeSegment, offices, type Office } from '../dropbox/shared';
import { downloadBytes } from '../dropbox/download';
import { coreProfile } from './runtime';

// Connection identity is saved at upload, independent of a later office or path.
export function officeForConnection(connection: string): Office {
  if (connection==='AET_App') return 'Miami';
  if (connection==='AET_App_East') return 'Boston';
  throw new AppError('document_connection_unavailable',409);
}
export async function coreFileMetadata(file: Row) {
  requireEnabled();
  const client=await clientForOffice(officeForConnection(file.storage_location));
  const metadata=(await client.filesGetMetadata({path:file.storage_file_id})).result;
  if (metadata['.tag']!=='file' || metadata.id!==file.storage_file_id || !metadata.path_display)
    throw new AppError('document_unavailable',409);
  return metadata;
}
/** First upload uses the conventional ID/name directory. Once files exist,
 * resolve their current directories by File ID. Ambiguity stops the upload for
 * staff confirmation; never recreate a stale cached directory automatically. */
export async function coreUploadPath(id: string, fileId: string, name: string, tx?: TransactionSql) {
  const sql=tx || db();
  const profile=await coreProfile(sql,id);
  const documents=await sql`select * from aet.aet_documents where application_id=${id} and access_scope='customer_input'`;
  const locations=new Set<string>();
  for (const file of documents) {
    const metadata=await coreFileMetadata(file);
    locations.add(JSON.stringify([file.storage_location,metadata.path_display!.slice(0,metadata.path_display!.lastIndexOf('/'))]));
  }
  let directory: string;
  if (locations.size>1) throw new AppError('directory_confirmation_required',409);
  if (locations.size===1) {
    const [connection,path]=JSON.parse([...locations][0]);
    // The dedicated upload transport currently routes by its conventional root.
    // Moving outside it requires the shared staff-confirmed upload workflow.
    const root=basePathFor(officeForConnection(connection));
    if (!offices.some(office=>path.startsWith(`${root}/${office}/`)) || !path.endsWith(` - ${id}`)) throw new AppError('directory_confirmation_required',409);
    directory=path;
  } else {
    const office=(profile.office || 'Miami') as Office;
    if (!offices.includes(office)) throw new AppError('directory_confirmation_required',409);
    directory=`${basePathFor(office)}/${office}/${safeSegment([profile.first_name,profile.middle_name,profile.last_name].filter(Boolean).join(' ')+' - '+id)}`;
  }
  return `${directory}/${safeSegment(fileId)}-${safeSegment(name)}`;
}
/** Authorization of applicationId occurs in the caller. A File ID is never a token. */
export async function downloadCoreFile(applicationId: string, recordId: string) {
  const [file]=await db()`select * from aet.aet_documents where id=${recordId} and application_id=${applicationId} and access_scope='customer_input'`;
  if (!file) throw new AppError('not_found',404);
  const metadata=await coreFileMetadata(file);
  const client=await clientForOffice(officeForConnection(file.storage_location));
  const result=(await client.filesDownload({path:metadata.id})).result;
  return downloadBytes(result);
}
