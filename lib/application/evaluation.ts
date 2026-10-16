import { z } from 'zod';
import { evaluationGroups, evaluationAdditionalDegree, type Rate } from '@/lib/pricing';

export const evaluationServiceIds = ['document', 'course'] as const;
export type EvaluationServiceId = typeof evaluationServiceIds[number];
export const evaluationServiceGroups = evaluationGroups.filter((group): group is typeof group & { id: EvaluationServiceId } => group.id === 'document' || group.id === 'course');
const choiceSchema = z.object({
  selected: z.boolean(), tier: z.string().max(100),
  educationIndexes: z.array(z.number().int().min(0).max(9)).max(10),
});
const emptyChoice = () => ({ selected: false, tier: '', educationIndexes: [] as number[] });
export const emptyEvaluationRequest = () => ({
  services: { document: emptyChoice(), course: emptyChoice() },
  translation: false,
});
export const evaluationRequestSchema = z.object({
  services: z.object({ document: choiceSchema, course: choiceSchema }),
  translation: z.boolean(),
});
export type EvaluationRequest = z.infer<typeof evaluationRequestSchema>;
export type EvaluationError = 'evaluationSelection' | 'evaluationTier' | 'evaluationEducation' | 'required';
export const evaluationPath = (id: EvaluationServiceId) => `evaluationRequest.services.${id}`;
export const usesEducation = (id: EvaluationServiceId): id is 'document' | 'course' => id === 'document' || id === 'course';

export function selectEvaluationService(request: EvaluationRequest, id: EvaluationServiceId, educationCount: number): EvaluationRequest {
  const group = evaluationServiceGroups.find(group => group.id === id)!;
  const previous = evaluationServiceIds.find(key => request.services[key].selected);
  const indexes = previous ? request.services[previous].educationIndexes.filter(index => index < educationCount && index >= 0) : [];
  const choice = request.services[id].selected ? request.services[id] : {
    selected: true, tier: group.rates[0].id, educationIndexes: educationCount === 1 ? [0] : indexes,
  };
  return { ...request, services: { ...emptyEvaluationRequest().services, [id]: choice } };
}

export function removeEvaluationEducation(request: EvaluationRequest, removedIndex: number): EvaluationRequest {
  const next = structuredClone(request);
  for (const id of evaluationServiceIds) {
    next.services[id].educationIndexes = next.services[id].educationIndexes.filter(index => index !== removedIndex).map(index => index > removedIndex ? index - 1 : index);
  }
  return next;
}

export function validateEvaluationRequest(request: EvaluationRequest, educationCount: number): Record<string, EvaluationError> {
  const errors: Record<string, EvaluationError> = {};
  if (evaluationServiceIds.filter(id => request.services[id].selected).length !== 1) errors.evaluationRequest = 'evaluationSelection';
  for (const group of evaluationServiceGroups) {
    const choice = request.services[group.id];
    if (!choice.selected) continue;
    if (!group.rates.some(rate => rate.id === choice.tier)) errors[evaluationPath(group.id) + '.tier'] = 'evaluationTier';
    const indexes = choice.educationIndexes;
    if (usesEducation(group.id) && (!indexes.length || new Set(indexes).size !== indexes.length || indexes.some(index => !Number.isInteger(index) || index < 0 || index >= educationCount))) {
      errors[evaluationPath(group.id) + '.educationIndexes'] = 'evaluationEducation';
    }
  }
  return errors;
}

export type EvaluationQuoteLine = {
  id: EvaluationServiceId; rate?: Rate; educationIndexes: number[];
  baseCents: number | null; additionalCents: number; additionalCount: number; totalCents: number | null;
};
/** Preview service fees only; report delivery and unquoted work are excluded. */
export function quoteEvaluation(request: EvaluationRequest, educationCount: number) {
  const lines: EvaluationQuoteLine[] = [];
  const selected = evaluationServiceGroups.filter(group => request.services[group.id].selected);
  // Conflicting older drafts must be resolved before showing a price.
  for (const group of selected.length === 1 ? selected : []) {
    const choice = request.services[group.id];
    if (!choice.selected) continue;
    const rate = group.rates.find(rate => rate.id === choice.tier);
    const indexes = usesEducation(group.id) ? [...new Set(choice.educationIndexes)].filter(index => Number.isInteger(index) && index >= 0 && index < educationCount).sort((a, b) => a - b) : [];
    const baseCents = rate?.price.kind === 'fixed' ? Math.round(rate.price.amount * 100) : null;
    const additionalCount = Math.max(0, indexes.length - 1);
    const additionalCents = usesEducation(group.id) ? additionalCount * Math.round(evaluationAdditionalDegree[group.id] * 100) : 0;
    const complete = baseCents !== null && (!usesEducation(group.id) || indexes.length > 0);
    lines.push({ id: group.id, rate, educationIndexes: indexes, baseCents, additionalCount, additionalCents, totalCents: complete ? baseCents! + additionalCents : null });
  }
  return {
    lines,
    subtotalCents: lines.reduce((sum, line) => sum + (line.totalCents ?? 0), 0),
    hasPricedServices: lines.some(line => line.totalCents !== null),
    incomplete: selected.length > 1 || lines.some(line => line.totalCents === null),
    needsQuote: request.translation,
  };
}

/** Preserve old single-service drafts, but ask the applicant to choose a current tier. */
export function migrateEvaluationRequest(legacyType: string, educationCount: number): EvaluationRequest {
  const request = emptyEvaluationRequest();
  if (evaluationServiceIds.some(id => id === legacyType)) {
    const id = legacyType as EvaluationServiceId;
    request.services[id] = { selected: true, tier: '', educationIndexes: usesEducation(id) && educationCount === 1 ? [0] : [] };
  }
  return request;
}
