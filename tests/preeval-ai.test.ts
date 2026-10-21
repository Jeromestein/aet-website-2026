import { describe, expect, it, vi, afterEach, beforeAll } from 'vitest';
vi.mock('server-only', () => ({}));
import { PDFDocument } from 'pdf-lib';
import { analyzeDocuments, responseBody, aiConfiguration } from '../lib/preeval/openai';
import { analysisSchema, validateAnalysis, digest, type AnalysisDocument } from '../lib/preeval/ai-contract';
import { validateDocument } from '../lib/preeval/ai-documents';
const academic = { school: 'Synthetic University', country: 'CN', degree: 'Bachelor of Science', start: '2018-09', end: '2022-06' };
const analysis = { result: "Bachelor's degree", reasoning: 'Synthetic assessment with explicitly unverified evidence.', basis: 'documents',
  facts: { institution: null, country: null, qualification: null, start: null, completion: null }, issues: [{ code: 'unverified', description: 'Institutional recognition has not been verified.' }],
  evidence: [{ documentId: 'document-1', page: 1, fact: 'Synthetic qualification' }] };
const doc: AnalysisDocument = { id: 'document-1', mime: 'application/pdf', bytes: Buffer.from('%PDF-1.7'), pages: 1, sha256: 'synthetic' };
beforeAll(async () => {
  const pdf = await PDFDocument.create(); pdf.addPage().drawText('Synthetic qualification');
  doc.bytes = Buffer.from(await pdf.save()); doc.sha256 = digest(doc.bytes);
});
const providerAnalysis = { ...analysis, usEquivalency: { level: 'bachelor', degree: "Bachelor's degree", field: null, concentration: null },
  evidence: [{ pageId: 'page-001', quote: 'Synthetic qualification', fact: 'Synthetic qualification' }] };
const { result: _legacyResult, ...providerOutput } = providerAnalysis;
const config = () => { vi.stubEnv('PREEVAL_AI_ENABLED','true'); vi.stubEnv('OPENAI_API_KEY','synthetic-test-key'); };
const reply = (overrides: object = {}) => Response.json({ status: 'completed', id: 'resp_synthetic', model: 'test-model', usage: { input_tokens: 10, output_tokens: 20, total_tokens: 30 },
  output: [{ type: 'message', content: [{ type: 'output_text', text: JSON.stringify(providerOutput) }] }], ...overrides });
afterEach(() => vi.unstubAllEnvs());
describe('Direct GPT file analysis', () => {
  it('sends identified page PDF and image bytes, no tools, and no stored response', () => {
    const body = responseBody('test-model', academic, [{ ...doc, id: 'page-001', documentId: 'document-1', page: 1 }, { ...doc, id: 'page-002', documentId: 'document-2', page: 1, mime: 'image/png' }]);
    expect(body.store).toBe(false); expect(body.tools).toEqual([]);
    expect(body.input[0].content).toContainEqual(expect.objectContaining({ type: 'input_file', file_data: expect.stringContaining('data:application/pdf;base64,') }));
    expect(body.input[0].content).toContainEqual(expect.objectContaining({ type: 'input_image', image_url: expect.stringContaining('data:image/png;base64,') }));
    expect(body.instructions).toContain('untrusted evidence');
    expect(body.text.format.strict).toBe(true);
  });
  it('accepts validated output and records provider metadata', async () => {
    config(); const fetcher = vi.fn().mockResolvedValue(reply());
    const result = await analyzeDocuments(academic,[doc],fetcher);
    expect(result.analysis.result).toBe(analysis.result); expect(result.usage.total_tokens).toBe(30); expect(result.responseId).toBe('resp_synthetic');
    expect(fetcher.mock.calls[0][0]).toBe('https://api.openai.com/v1/responses');
  });
  it('does not request the provider without the key', async () => {
    vi.stubEnv('PREEVAL_AI_ENABLED','true'); vi.stubEnv('OPENAI_API_KEY',''); const fetcher = vi.fn();
    await expect(analyzeDocuments(academic,[],fetcher)).rejects.toThrow('ai_key_missing'); expect(fetcher).not.toHaveBeenCalled();
  });
  it('requires the explicit feature switch', () => { vi.stubEnv('PREEVAL_AI_ENABLED','false'); expect(aiConfiguration).toThrow('ai_disabled'); });
  it.each([[401,'ai_credentials_rejected'],[403,'ai_credentials_rejected'],[429,'ai_rate_limit'],[500,'ai_provider_failed'],[400,'ai_provider_failed']])('sanitizes provider HTTP %s errors', async (status, code) => {
    config(); await expect(analyzeDocuments(academic,[doc],vi.fn().mockResolvedValue(new Response('sensitive provider body',{status: Number(status)})))).rejects.toMatchObject({ code });
  });
  it('marks network failures retryable', async () => { config(); await expect(analyzeDocuments(academic,[doc],vi.fn().mockRejectedValue(new Error('private URL')))).rejects.toMatchObject({ code:'ai_connection_failed',retryable:true }); });
  it('rejects incomplete results', async () => { config(); await expect(analyzeDocuments(academic,[doc],vi.fn().mockResolvedValue(reply({status:'incomplete'})))).rejects.toThrow('ai_incomplete'); });
  it('handles model refusal', async () => { config(); await expect(analyzeDocuments(academic,[doc],vi.fn().mockResolvedValue(reply({output:[{type:'message',content:[{type:'refusal',refusal:'refused'}]}]})))).rejects.toThrow('ai_refused'); });
  it('rejects unknown document citations and invented pages', () => {
    for (const evidence of [[{documentId:'other-file',page:1,fact:'X'}],[{documentId:'document-1',page:2,fact:'X'}]]) expect(() => validateAnalysis({...analysis,evidence},[doc])).toThrow('invalid_ai_evidence');
  });
  it('never silently downgrades supplied files to form-only', () => { expect(() => validateAnalysis({...analysis,basis:'form_only',evidence:[]},[doc])).toThrow('invalid_ai_evidence'); });
  it('allows explicit form-only assessment without invented extracted facts', () => { expect(validateAnalysis({...analysis,basis:'form_only',evidence:[]},[]).basis).toBe('form_only'); });
  it('supports conflicts and unreadable evidence without fabricating a conclusion', () => {
    expect(analysisSchema.parse({...analysis,result:'Unable to determine',basis:'insufficient',evidence:[],issues:[{code:'conflict',description:'Form and diploma disagree.'},{code:'unreadable',description:'Completion date is illegible.'}]}).issues).toHaveLength(2);
  });
  it('validates actual PDF page count', async () => {
    const pdf = await PDFDocument.create(); pdf.addPage();
    expect(await validateDocument(Buffer.from(await pdf.save()),'application/pdf')).toBe(1);
    for(let i=0;i<10;i++) pdf.addPage();
    await expect(validateDocument(Buffer.from(await pdf.save()),'application/pdf')).rejects.toThrow('pdf_page_limit');
  });
  it('rejects broken PDFs and spoofed images before API submission', async () => {
    await expect(validateDocument(Buffer.from('%PDF-1.7 invalid'),'application/pdf')).rejects.toThrow('unreadable_document');
    await expect(validateDocument(Buffer.from('<html>'),'image/png')).rejects.toThrow('invalid_document');
  });
});
