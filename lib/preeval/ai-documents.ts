import 'server-only';
import { downloadBytes } from '../dropbox/download';
import { PDFDocument } from 'pdf-lib';
import { table, db, type Row } from './db';
import { clientForOffice, listFiles, dropboxHash, requireEnabled } from '../dropbox/server';
import { resolveStorage } from '../dropbox/storage';
import { contextFor } from '../dropbox/application';
import { officeForStoredPath } from './dropbox';
import { AIError, digest, MAX_DOCUMENTS, MAX_TOTAL_BYTES, type AnalysisDocument } from './ai-contract';
import { validFile } from './domain';
import type { Office } from '../dropbox/shared';
export type ManifestEntry = { id: string; path: string; office: Office; revision: string; contentHash: string; size: number; mime: string };
export async function documentManifest(app: Row): Promise<ManifestEntry[]> {
  requireEnabled();
  const rows = await db()`select * from ${table('preeval.files')} where application_id=${app.id} order by created_at`;
  if (rows.some(f => f.state !== 'ready')) throw new AIError('uploads_incomplete');
  const context = contextFor({ ...app, created_at: new Date(app.created_at).toISOString() }, 'pre-evaluation');
  const storage = await resolveStorage(context);
  const paths = new Map<string, string>();
  for (const row of rows) paths.set(row.dropbox_path.toLowerCase(), row.dropbox_path);
  let cursor: string | null = null;
  do {
    const page = await listFiles(context, cursor);
    for (const f of page.files) paths.set(f.pathDisplay.toLowerCase(), f.pathDisplay);
    cursor = page.nextCursor;
    if (paths.size > MAX_DOCUMENTS) throw new AIError('document_count_limit');
  } while (cursor);
  const entries: ManifestEntry[] = [];
  for (const path of [...paths.values()].sort()) {
    const location = storage.reads.find(l => path.slice(0, path.lastIndexOf('/')).toLowerCase() === l.path.toLowerCase());
    const office = location?.office || officeForStoredPath(path);
    const dbx = await clientForOffice(office);
    let metadata;
    try { metadata = (await dbx.filesGetMetadata({ path })).result; }
    catch { throw new AIError('document_unavailable'); }
    if (metadata['.tag'] !== 'file') throw new AIError('document_unavailable');
    const mime = /\.pdf$/i.test(metadata.name) ? 'application/pdf' : /\.png$/i.test(metadata.name) ? 'image/png' : /\.jpe?g$/i.test(metadata.name) ? 'image/jpeg' : '';
    if (!mime) throw new AIError('unsupported_document');
    if (!metadata.size || metadata.size > 20 * 1024 * 1024) throw new AIError('document_size_limit');
    entries.push({ id: metadata.id, path, office, revision: metadata.rev, contentHash: metadata.content_hash || '', size: metadata.size, mime });
  }
  if (entries.reduce((sum, f) => sum + f.size, 0) > MAX_TOTAL_BYTES) throw new AIError('document_total_size_limit');
  return entries;
}
export const manifestHash = (manifest: ManifestEntry[]) => digest(JSON.stringify(manifest));
export async function validateDocument(bytes: Buffer, mime: string): Promise<number> {
  if (!validFile(bytes, mime)) throw new AIError('invalid_document');
  try {
    const pdf = mime === 'application/pdf' ? await PDFDocument.load(bytes) : await PDFDocument.create();
    if (mime === 'application/pdf') {
      if (pdf.isEncrypted) throw new AIError('encrypted_document');
      const count = pdf.getPageCount();
      if (count < 1 || count > 10) throw new AIError('pdf_page_limit');
      return count;
    }
    const img = mime === 'image/png' ? await pdf.embedPng(bytes) : await pdf.embedJpg(bytes);
    if (img.width * img.height > 40_000_000) throw new AIError('image_dimensions_limit');
    return 1;
  } catch (e) { if (e instanceof AIError) throw e; throw new AIError('unreadable_document'); }
}
export async function loadDocuments(manifest: ManifestEntry[]): Promise<AnalysisDocument[]> {
  const documents: AnalysisDocument[] = [];
  for (const [index, entry] of manifest.entries()) {
    const dbx = await clientForOffice(entry.office);
    let file;
    try { file = (await dbx.filesDownload({ path: `rev:${entry.revision}` })).result; }
    catch { throw new AIError('document_unavailable'); }
    const bytes = await downloadBytes(file);
    if (bytes.length !== entry.size || (entry.contentHash && dropboxHash(bytes) !== entry.contentHash)) throw new AIError('document_changed', true);
    documents.push({ id: `document-${index + 1}`, mime: entry.mime, bytes, pages: await validateDocument(bytes, entry.mime), sha256: digest(bytes) });
  }
  if (documents.reduce((sum, f) => sum + f.pages, 0) > 20) throw new AIError('document_page_limit');
  return documents;
}
