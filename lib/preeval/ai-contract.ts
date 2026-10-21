import { z } from 'zod';
import { createHash } from 'node:crypto';
export const PROMPT_VERSION = 'preeval-direct-pages-v3';
export const MAX_DOCUMENTS = 5;
export const MAX_TOTAL_BYTES = 30 * 1024 * 1024;
export type AcademicInput = { school: string; country: string; degree: string; start: string; end: string };
export type AnalysisDocument = { id: string; mime: string; bytes: Buffer; pages: number; sha256: string };
const fact = z.string().max(500).nullable();
export const equivalencySchema = z.object({
  level: z.enum(['secondary', 'associate', 'bachelor', 'master', 'doctoral', 'other', 'undetermined']),
  degree: z.string().min(1).max(70).nullable(),
  field: z.string().min(1).max(50).nullable(),
  concentration: z.string().min(1).max(50).nullable(),
}).strict();
export const analysisSchema = z.object({
  result: z.string().min(3).max(200),
  usEquivalency: equivalencySchema.optional(), // Historical outputs remain readable.
  reasoning: z.string().min(10).max(2500),
  basis: z.enum(['documents', 'form_only', 'insufficient']),
  facts: z.object({ institution: fact, country: fact, qualification: fact, start: fact, completion: fact }).strict(),
  issues: z.array(z.object({ code: z.enum(['unreadable', 'insufficient', 'conflict', 'unverified']), description: z.string().min(1).max(600) }).strict()).max(20),
  evidence: z.array(z.object({ documentId: z.string(), page: z.number().int().min(1), fact: z.string().min(1).max(600), quote: z.string().min(1).max(300).optional(), pageId: z.string().optional() }).strict()).max(40),
}).strict();
export type Analysis = z.infer<typeof analysisSchema>;
export class AIError extends Error {
  constructor(public code: string, public retryable = false) { super(code); }
}
export const digest = (value: string | Buffer) => createHash('sha256').update(value).digest('hex');
export function validateAnalysis(value: unknown, documents: AnalysisDocument[]): Analysis {
  const parsed = analysisSchema.safeParse(value);
  if (!parsed.success) throw new AIError('invalid_ai_output');
  const result = parsed.data;
  if (!documents.length && Object.values(result.facts).some(f => f !== null)) throw new AIError('invalid_ai_evidence');
  if ((!documents.length && result.basis === 'documents') || (documents.length && result.basis === 'form_only') ||
      result.evidence.some(e => !documents.some(d => d.id === e.documentId && e.page <= d.pages)) ||
      (result.basis === 'documents' && !result.evidence.length)) throw new AIError('invalid_ai_evidence');
  return result;
}

// Provider output uses only server-issued page IDs; it never supplies numeric locations.
export const providerAnalysisSchema = analysisSchema.omit({ result: true, usEquivalency: true, evidence: true }).extend({
  usEquivalency: equivalencySchema,
  evidence: z.array(z.object({ pageId: z.string(), quote: z.string().min(1).max(300), fact: z.string().min(1).max(600) }).strict()).max(40),
}).strict();
export function equivalencyTitle(value: z.infer<typeof equivalencySchema>) {
  if (value.level === 'undetermined') {
    if (value.degree !== null || value.field !== null || value.concentration !== null) throw new AIError('invalid_ai_equivalency');
    return 'Unable to determine';
  }
  if (!value.degree?.trim() || value.field !== null && !value.field.trim() || value.concentration !== null && !value.concentration.trim())
    throw new AIError('invalid_ai_equivalency');
  let title = value.degree.trim();
  if (value.field && !title.toLowerCase().endsWith(' ' + value.field.trim().toLowerCase())) title += ` in ${value.field.trim()}`;
  if (value.concentration) title += ` with a concentration in ${value.concentration.trim()}`;
  return title;
}
export function resolveProviderAnalysis(value: unknown, documents: AnalysisDocument[], pages: { id: string; documentId: string; page: number }[]) {
  const parsed = providerAnalysisSchema.safeParse(value);
  if (!parsed.success) throw new AIError('invalid_ai_output');
  const output = parsed.data;
  if (output.basis === 'insufficient' && output.usEquivalency.level !== 'undetermined') throw new AIError('invalid_ai_equivalency');
  const evidence = output.evidence.map(item => {
    const source = pages.find(page => page.id === item.pageId);
    if (!source) throw new AIError('invalid_ai_evidence');
    if (!item.quote.trim() || !item.fact.trim()) throw new AIError('invalid_ai_evidence');
    return { ...item, documentId: source.documentId, page: source.page };
  });
  return validateAnalysis({ ...output, result: equivalencyTitle(output.usEquivalency), evidence }, documents);
}
