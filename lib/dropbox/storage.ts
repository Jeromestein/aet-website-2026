import 'server-only';
import type { TransactionSql } from 'postgres';
import { db, table } from '../preeval/db';
import { initialStorage, validateStorage, type DocumentIdentity, type DocumentStorage } from './paths';

/** Caller must authorize the application before resolving any storage location.
 * First writer wins; later profile/office edits never rewrite the saved location.
 * Use the application's creation transaction when available. */
export async function resolveStorage(context: DocumentIdentity, tx?: TransactionSql): Promise<DocumentStorage> {
  const sql = tx ?? db();
  const relation = table('evaluation.document_locations');
  const [existing] = await sql`select storage from ${relation} where application_id=${context.id} and kind=${context.kind}`;
  if (existing) return validateStorage(existing.storage, context.id);
  const proposed = initialStorage(context);
  await sql`insert into ${relation}(application_id,kind,storage) values(${context.id},${context.kind},${sql.json(proposed as never)}) on conflict(application_id,kind) do nothing`;
  const [saved] = await sql`select storage from ${relation} where application_id=${context.id} and kind=${context.kind}`;
  return validateStorage(saved.storage, context.id);
}
