import { describe, expect, it } from 'vitest';
import { evaluationAdditionalDegree, hasEvaluationCutoff } from '../lib/pricing';
import { emptyEvaluationRequest, evaluationPath, evaluationServiceGroups, migrateEvaluationRequest, quoteEvaluation, removeEvaluationEducation, selectEvaluationService, validateEvaluationRequest } from '../lib/application/evaluation';
import { initialDraft, restoreDraft, selectService, validateStep } from '../lib/application/model';

const completedDraft = () => ({
  ...initialDraft('evaluation'), contactName: 'Test', email: 'preview@example.com', phone: '+1 202 555 0148', office: 'la',
  pronouns: 'mx', firstName: 'Test', lastName: 'Applicant', purpose: 'education',
  educations: [{ school: 'Example University', country: 'CN', degree: 'Bachelor', start: '2018-09', end: '2022-06' }],
});
const restore = (data: unknown) => {
  const now = Date.now();
  return restoreDraft(JSON.stringify({ version: 1, updatedAt: now, step: 2, data }), now)!;
};

describe('general application evaluation selection', () => {
  it('uses current document/course catalog tiers and shared additional-degree rates', () => {
    expect(evaluationServiceGroups.map(group => group.id)).toEqual(['document', 'course']);
    for (const group of evaluationServiceGroups) for (const rate of group.rates) {
      const request = selectEvaluationService(emptyEvaluationRequest(), group.id, 2);
      request.services[group.id].tier = rate.id;
      request.services[group.id].educationIndexes = [0, 1];
      expect(validateEvaluationRequest(request, 2)).toEqual({});
      const quote = quoteEvaluation(request, 2);
      const base = rate.price.kind === 'fixed' ? rate.price.amount : NaN;
      expect(quote.subtotalCents).toBe((base + evaluationAdditionalDegree[group.id]) * 100);
      expect(quote.incomplete).toBe(false);
    }
  });
  it('switches services exclusively, carrying qualifications but replacing the old fee', () => {
    let request = selectEvaluationService(emptyEvaluationRequest(), 'document', 3);
    request.services.document.educationIndexes = [0, 2];
    expect(quoteEvaluation(request, 3).subtotalCents).toBe(14000);
    request = selectEvaluationService(request, 'course', 3);
    expect(request.services.document).toEqual({ selected: false, tier: '', educationIndexes: [] });
    expect(request.services.course.educationIndexes).toEqual([0, 2]);
    expect(quoteEvaluation(request, 3)).toMatchObject({ subtotalCents: 24000, lines: [{ id: 'course' }] });
    request.services.course.tier = 'rush';
    expect(selectEvaluationService(request, 'course', 3)).toEqual(request);
    request = selectEvaluationService(request, 'document', 3);
    expect(request.services.course.selected).toBe(false);
    expect(quoteEvaluation(request, 3).subtotalCents).toBe(14000);
  });
  it('rejects retired tiers instead of assigning a price', () => {
    const request = selectEvaluationService(emptyEvaluationRequest(), 'course', 1);
    request.services.course.tier = 'retired';
    expect(validateEvaluationRequest(request, 1)).toHaveProperty(evaluationPath('course') + '.tier', 'evaluationTier');
    expect(quoteEvaluation(request, 1)).toMatchObject({ subtotalCents: 0, hasPricedServices: false, incomplete: true });
  });
  it.each([
    ['document', 'nextDay', 200], ['document', 'sameDay', 250],
    ['course', 'nextDay', 350], ['course', 'sameDay', 450],
  ] as const)('preserves and quotes expedited %s/%s at USD %i', (id, tier, amount) => {
    const request = selectEvaluationService(emptyEvaluationRequest(), id, 1);
    request.services[id].tier = tier;
    const restored = restore({ ...completedDraft(), evaluationRequest: request });
    expect(restored.step).toBe(2);
    expect(validateEvaluationRequest(restored.data.evaluationRequest, 1)).toEqual({});
    const quote = quoteEvaluation(restored.data.evaluationRequest, 1);
    expect(quote).toMatchObject({ subtotalCents: amount * 100, incomplete: false, hasPricedServices: true });
    expect(hasEvaluationCutoff(quote.lines[0].rate)).toBe(true);
    expect(hasEvaluationCutoff(evaluationServiceGroups.find(group => group.id === id)!.rates[0])).toBe(false);
  });
  it('requires exactly one evaluation and never totals conflicting selections', () => {
    const request = emptyEvaluationRequest();
    request.translation = true;
    expect(validateEvaluationRequest(request, 1)).toHaveProperty('evaluationRequest', 'evaluationSelection');
    request.services.document = { selected: true, tier: 'standard', educationIndexes: [0] };
    request.services.course = { selected: true, tier: 'standard', educationIndexes: [0] };
    expect(validateEvaluationRequest(request, 1)).toHaveProperty('evaluationRequest', 'evaluationSelection');
    expect(quoteEvaluation(request, 1)).toMatchObject({ lines: [], hasPricedServices: false, subtotalCents: 0, incomplete: true });
  });
  it('keeps pending translation out of the known subtotal', () => {
    const request = selectEvaluationService(emptyEvaluationRequest(), 'document', 1);
    request.translation = true;
    expect(quoteEvaluation(request, 1)).toMatchObject({ needsQuote: true, hasPricedServices: true, subtotalCents: 10000 });
  });
  it('requires valid qualification associations', () => {
    const request = selectEvaluationService(emptyEvaluationRequest(), 'document', 2);
    expect(validateEvaluationRequest(request, 2)).toHaveProperty(evaluationPath('document') + '.educationIndexes');
    expect(quoteEvaluation(request, 2)).toMatchObject({ incomplete: true, hasPricedServices: false });
    for (const indexes of [[0, 0], [2], [-1], [0.5]]) {
      request.services.document.educationIndexes = indexes;
      expect(validateEvaluationRequest(request, 2)).toHaveProperty(evaluationPath('document') + '.educationIndexes');
    }
  });
  it('keeps surviving qualifications associated after an education record is removed', () => {
    const request = selectEvaluationService(emptyEvaluationRequest(), 'document', 3);
    request.services.document.educationIndexes = [0, 2];
    const next = removeEvaluationEducation(request, 1);
    expect(next.services.document.educationIndexes).toEqual([0, 1]);
    expect(quoteEvaluation(next, 2).subtotalCents).toBe(14000);
    expect(request.services.document.educationIndexes).toEqual([0, 2]);
    const noQualifications = removeEvaluationEducation(removeEvaluationEducation(next, 0), 0);
    expect(validateEvaluationRequest(noQualifications, 1)).toHaveProperty(evaluationPath('document') + '.educationIndexes');
    expect(quoteEvaluation(noQualifications, 1)).toMatchObject({ hasPricedServices: false, subtotalCents: 0 });
  });
  it('preserves old single-service drafts but requires a current tier before review', () => {
    const { evaluationRequest: _request, ...legacyData } = { ...completedDraft(), evaluationType: 'course' };
    const restored = restore(legacyData);
    expect(restored).toMatchObject({ step: 1, data: { contactName: 'Test', evaluationRequest: { services: { course: { selected: true, tier: '', educationIndexes: [0] } } } } });
    restored.data.evaluationRequest.services.course.tier = 'standard';
    expect(restore(restored.data)).toMatchObject({ step: 2, data: { evaluationRequest: restored.data.evaluationRequest } });
    for (const legacyType of ['expert', 'position', 'unsure']) expect(migrateEvaluationRequest(legacyType, 1)).toEqual(emptyEvaluationRequest());
  });
  it('removes hidden services and guidance from old drafts without losing identity or education', () => {
    const draft = completedDraft();
    const restored = restore({ ...draft, evaluationRequest: {
      services: { ...draft.evaluationRequest.services, expert: { selected: true, tier: 'standard', educationIndexes: [] }, position: { selected: true, tier: 'rush', educationIndexes: [] } },
      translation: false, guidance: true, guidanceNotes: 'Old help request',
    } });
    expect(restored.step).toBe(1);
    expect(restored.data.educations).toEqual(draft.educations);
    expect(restored.data.firstName).toBe(draft.firstName);
    expect(restored.data.evaluationRequest).toEqual(emptyEvaluationRequest());
    expect(quoteEvaluation(restored.data.evaluationRequest, 1)).toMatchObject({ subtotalCents: 0, needsQuote: false });
  });
  it('requires a fresh choice when an older draft selected both evaluation types', () => {
    const request = selectEvaluationService(emptyEvaluationRequest(), 'document', 1);
    request.services.course = { selected: true, tier: 'standard', educationIndexes: [0] };
    request.translation = true;
    const restored = restore({ ...completedDraft(), evaluationRequest: request });
    expect(restored.step).toBe(1);
    expect(restored.data.evaluationRequest).toEqual({ ...emptyEvaluationRequest(), translation: true });
  });
  it('does not apply evaluation selection rules to other service branches', () => {
    const draft = { ...initialDraft('translation'), sourceLanguage: 'Chinese', targetLanguage: 'English', translationType: 'certified' };
    draft.evaluationRequest = selectEvaluationService(draft.evaluationRequest, 'document', 1);
    expect(validateStep(draft, 1)).toEqual({});
    const changed = selectService(draft, 'pre-evaluation');
    expect(validateStep(changed, 1)).not.toHaveProperty('evaluationRequest');
    expect(selectService(changed, 'evaluation').evaluationRequest).toEqual(draft.evaluationRequest);
  });
});
