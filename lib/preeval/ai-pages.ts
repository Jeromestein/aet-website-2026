import 'server-only';
import { PDFDocument } from 'pdf-lib';
import { AIError, digest, MAX_DOCUMENTS, MAX_TOTAL_BYTES, type AnalysisDocument } from './ai-contract';

/** Single physical pages, not logical/printed page labels. Originals remain untouched. */
export type EvidencePage = {
  id: string; documentId: string; page: number; mime: string; bytes: Buffer; sha256: string;
};
export async function prepareEvidencePages(documents: AnalysisDocument[]): Promise<EvidencePage[]> {
  if (documents.length > MAX_DOCUMENTS || new Set(documents.map(d => d.id)).size !== documents.length)
    throw new AIError('document_count_limit');
  if (documents.reduce((sum, d) => sum + d.bytes.length, 0) > MAX_TOTAL_BYTES) throw new AIError('document_total_size_limit');
  if (documents.reduce((sum, d) => sum + d.pages, 0) > 20) throw new AIError('document_page_limit');
  const pages: EvidencePage[] = [];
  let preparedBytes = 0;
  for (const document of documents) {
    if (digest(document.bytes) !== document.sha256) throw new AIError('document_changed');
    if (!Number.isInteger(document.pages) || document.pages < 1 || document.pages > 10) throw new AIError('pdf_page_limit');
    if (!['application/pdf', 'image/png', 'image/jpeg'].includes(document.mime)) throw new AIError('unsupported_document');
    const append = (bytes: Buffer, page: number) => {
      preparedBytes += bytes.length;
      if (preparedBytes > MAX_TOTAL_BYTES) throw new AIError('document_total_size_limit');
      pages.push({ id: `page-${String(pages.length + 1).padStart(3, '0')}`, documentId: document.id,
        page, mime: document.mime, bytes, sha256: digest(bytes) });
    };
    if (document.mime !== 'application/pdf') {
      if (document.pages !== 1) throw new AIError('invalid_document');
      append(document.bytes, 1);
      continue;
    }
    try {
      const source = await PDFDocument.load(document.bytes, { updateMetadata: false });
      if (source.isEncrypted) throw new AIError('encrypted_document');
      if (source.getPageCount() !== document.pages) throw new AIError('invalid_document');
      if (document.pages === 1) { append(document.bytes, 1); continue; }
      for (let index = 0; index < document.pages; index++) {
        const single = await PDFDocument.create();
        const [page] = await single.copyPages(source, [index]);
        single.addPage(page);
        // Fixed metadata keeps equivalent inputs reproducible; no names are propagated.
        single.setCreationDate(new Date(0)); single.setModificationDate(new Date(0));
        append(Buffer.from(await single.save()), index + 1);
      }
    } catch (error) {
      if (error instanceof AIError) throw error;
      throw new AIError('unreadable_document');
    }
  }
  return pages;
}
