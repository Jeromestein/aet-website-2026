import { beforeAll, describe, expect, it, vi } from 'vitest';
vi.mock('server-only', () => ({}));
import { PDFDocument, degrees } from 'pdf-lib';
import { prepareEvidencePages } from '../lib/preeval/ai-pages';
import { digest, equivalencyTitle, resolveProviderAnalysis, validateAnalysis, type AnalysisDocument } from '../lib/preeval/ai-contract';
import { responseBody } from '../lib/preeval/openai';
let document: AnalysisDocument;
beforeAll(async () => {
  const pdf = await PDFDocument.create();
  pdf.addPage([400, 600]).drawText('Cover page only');
  const page = pdf.addPage([600, 400]); page.drawText('Degree evidence on physical page two'); page.setRotation(degrees(90));
  const bytes = Buffer.from(await pdf.save());
  document = { id: 'document-1', bytes, sha256: digest(bytes), pages: 2, mime: 'application/pdf' };
});
const academic = { school: '', country: '', degree: '', start: '', end: '' };
const output = () => ({
  usEquivalency: { level: 'bachelor', degree: 'Bachelor of Science', field: 'Business Administration', concentration: 'Financial Management' },
  reasoning: 'The documented degree and specialization support this preliminary US mapping.', basis: 'documents',
  facts: { institution: null, country: null, qualification: null, start: null, completion: null }, issues: [],
  evidence: [{ pageId: 'page-002', quote: 'Degree evidence on physical page two', fact: 'The second page supports degree completion.' }],
});
describe('Stable physical evidence pages', () => {
  it('keeps covers, page geometry and rotation without modifying original bytes', async () => {
    const before = Buffer.from(document.bytes);
    const pages = await prepareEvidencePages([document]);
    expect(pages.map(p => [p.id, p.documentId, p.page])).toEqual([
      ['page-001', 'document-1', 1], ['page-002', 'document-1', 2],
    ]);
    for (const [index, page] of pages.entries()) {
      const pdf = await PDFDocument.load(page.bytes);
      expect(pdf.getPageCount()).toBe(1);
      expect(pdf.getPage(0).getSize()).toEqual(index ? { width: 600, height: 400 } : { width: 400, height: 600 });
      expect(pdf.getPage(0).getRotation().angle).toBe(index ? 90 : 0);
    }
    expect(document.bytes).toEqual(before);
    expect((await prepareEvidencePages([document])).map(p => p.sha256)).toEqual(pages.map(p => p.sha256));
  });
  it('maps the second document page independently of the first document length', async () => {
    const pages = await prepareEvidencePages([document, { ...document, id: 'document-2' }]);
    const result = resolveProviderAnalysis({ ...output(), evidence: [{ ...output().evidence[0], pageId: 'page-003' }] },
      [document, { ...document, id: 'document-2' }], pages);
    expect(result.evidence[0]).toMatchObject({ documentId: 'document-2', page: 1, pageId: 'page-003' });
  });
  it('sends one-page attachments with explicit IDs instead of relying on model counting', async () => {
    const pages = await prepareEvidencePages([document]);
    const body = responseBody('test-model', academic, pages);
    const files = body.input[0].content.filter(c => c.type === 'input_file');
    expect(files.map(f => 'filename' in f && f.filename)).toEqual(['page-001.pdf', 'page-002.pdf']);
    expect(body.instructions).not.toContain('Keep result under 10 words');
    const schema = JSON.stringify(body.text.format.schema);
    expect(schema).toContain('pageId'); expect(schema).not.toContain('"documentId"');
    expect(schema).not.toContain('"page"');
  });
  it('rejects mismatched hashes, page counts, duplicate document IDs and limits', async () => {
    await expect(prepareEvidencePages([{ ...document, sha256: 'wrong' }])).rejects.toThrow('document_changed');
    await expect(prepareEvidencePages([{ ...document, pages: 1 }])).rejects.toThrow('invalid_document');
    await expect(prepareEvidencePages([document, document])).rejects.toThrow('document_count_limit');
    await expect(prepareEvidencePages(Array.from({ length: 6 }, (_, i) => ({ ...document, id: 'd' + i })))).rejects.toThrow('document_count_limit');
    await expect(prepareEvidencePages([{ ...document, pages: 11 }])).rejects.toThrow('pdf_page_limit');
    await expect(prepareEvidencePages([{ ...document, mime: 'text/plain' }])).rejects.toThrow('unsupported_document');
  });
  it('rejects invented IDs and model-supplied numeric locations', async () => {
    const pages = await prepareEvidencePages([document]);
    expect(() => resolveProviderAnalysis({ ...output(), evidence: [{ ...output().evidence[0], pageId: 'page-999' }] }, [document], pages)).toThrow('invalid_ai_evidence');
    expect(() => resolveProviderAnalysis({ ...output(), evidence: [{ ...output().evidence[0], page: 1 }] }, [document], pages)).toThrow('invalid_ai_output');
    expect(() => resolveProviderAnalysis({ ...output(), evidence: [{ ...output().evidence[0], quote: ' ' }] }, [document], pages)).toThrow('invalid_ai_evidence');
  });
});
describe('Complete preliminary US equivalency', () => {
  it('preserves the full degree, academic field and concentration in the customer title', async () => {
    const result = resolveProviderAnalysis(output(), [document], await prepareEvidencePages([document]));
    expect(result.result).toBe('Bachelor of Science in Business Administration with a concentration in Financial Management');
    expect(result.evidence[0]).toMatchObject({ documentId: 'document-1', page: 2 });
    expect(result.usEquivalency?.concentration).toBe('Financial Management');
  });
  it('does not duplicate a field that is part of an integrated degree name', () => {
    expect(equivalencyTitle({ level: 'bachelor', degree: 'Bachelor of Social Work', field: 'Social Work', concentration: null })).toBe('Bachelor of Social Work');
  });
  it('does not mistake Art for the Arts degree suffix', () => {
    expect(equivalencyTitle({ level: 'bachelor', degree: 'Bachelor of Arts', field: 'Art', concentration: null })).toBe('Bachelor of Arts in Art');
  });
  it('preserves inability to determine instead of forcing a degree match', () => {
    const unknown = { level: 'undetermined' as const, degree: null, field: null, concentration: null };
    expect(equivalencyTitle(unknown)).toBe('Unable to determine');
    expect(() => equivalencyTitle({ ...unknown, degree: 'Bachelor' })).toThrow('invalid_ai_equivalency');
    expect(() => resolveProviderAnalysis({ ...output(), basis: 'insufficient', evidence: [] }, [document], [])).toThrow('invalid_ai_equivalency');
    expect(resolveProviderAnalysis({ ...output(), usEquivalency: unknown, basis: 'insufficient', evidence: [] }, [document], []).result).toBe('Unable to determine');
  });
  it('retains historical output compatibility and form-only assessments', () => {
    const old = { result: "Bachelor's degree", reasoning: 'Legacy preliminary comparison based on form input.', basis: 'form_only',
      facts: output().facts, issues: [], evidence: [] };
    expect(validateAnalysis(old, [])).toEqual(old);
    expect(resolveProviderAnalysis({ ...output(), basis: 'form_only', evidence: [] }, [], []).result).toContain('Business Administration');
  });
});
