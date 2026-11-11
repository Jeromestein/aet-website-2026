import {formalCore,readFormal} from '../application-core/formal-store';
import {coreTable} from '../application-core/connection';
import {coreFileMetadata,officeForConnection} from '../application-core/documents';
import {AppError} from '../preeval/domain';
import 'server-only';
import type { TransactionSql } from 'postgres';
import { db, table } from '../preeval/db';
import { initialStorage, validateStorage, type DocumentIdentity, type DocumentStorage } from './paths';

/** Caller must authorize the application before resolving any storage location.
 * First writer wins; later profile/office edits never rewrite the saved location.
 * Use the application's creation transaction when available. */
export async function resolveStorage(context: DocumentIdentity, tx?: TransactionSql): Promise<DocumentStorage> {
  const sql = tx ?? db();
  if(formalCore()){
    if(context.kind==='evaluation')await readFormal(context.id,sql);
    else if(!(await sql`select id from ${coreTable(sql,'aet_core_applications')} where id=${context.id} and primary_service='pre-evaluation'`).length)throw new AppError('not_found',404);
    const files=await sql`select * from ${coreTable(sql,'aet_documents')} where application_id=${context.id} and access_scope='customer_input' and storage_file_id is not null`;
    const directories=new Map<string,{office:DocumentIdentity['office'];path:string}>();
    for(const file of files){const m=await coreFileMetadata(file);const path=m.path_display!.slice(0,m.path_display!.lastIndexOf('/'));const office=officeForConnection(file.storage_location);directories.set(file.storage_location+':'+path.toLowerCase(),{office,path});}
    if(directories.size>1)throw new AppError('directory_confirmation_required',409);
    if(!directories.size)return initialStorage(context);
    const write=[...directories.values()][0];return {write,reads:[write],archivePath:initialStorage(context).archivePath};
  }
  const relation = table('evaluation.document_locations');
  const [existing] = await sql`select storage from ${relation} where application_id=${context.id} and kind=${context.kind}`;
  if (existing) return validateStorage(existing.storage, context.id);
  const proposed = initialStorage(context);
  await sql`insert into ${relation}(application_id,kind,storage) values(${context.id},${context.kind},${sql.json(proposed as never)}) on conflict(application_id,kind) do nothing`;
  const [saved] = await sql`select storage from ${relation} where application_id=${context.id} and kind=${context.kind}`;
  return validateStorage(saved.storage, context.id);
}
