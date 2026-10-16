import { describe, expect, it } from 'vitest';
import { applicationCopy } from '../lib/application/copy';
import { initialDraft, restoreDraft, selectService, serviceFromQuery, serviceOffices, validateStep } from '../lib/application/model';

const contact = () => ({ ...initialDraft('translation'), contactName: 'Example Organization', email: 'preview@example.com', phone: '+1 (202) 555-0148', office: 'boston' });

describe('general application preview', () => {
  it('uses the approved service-specific office lists', () => {
    expect(serviceOffices.evaluation).toEqual(['miami', 'la', 'sf']);
    expect(serviceOffices['pre-evaluation']).toEqual(serviceOffices.evaluation);
    expect(serviceOffices.translation).toEqual(['miami', 'boston', 'la', 'sf', 'nyc']);
    expect(validateStep(contact(), 0)).toEqual({});
    expect(validateStep({ ...contact(), office: 'bj' }, 0)).toHaveProperty('office');
    expect(validateStep({ ...contact(), service: 'evaluation' }, 0)).toHaveProperty('office');
  });
  it('clears an incompatible office without discarding contact or service answers', () => {
    const original = { ...contact(), sourceLanguage: 'Chinese', targetLanguage: 'English' };
    const switched = selectService(original, 'evaluation');
    expect(switched.office).toBe('');
    expect(switched.email).toBe(original.email);
    expect(switched.sourceLanguage).toBe('Chinese');
    expect(original.office).toBe('boston');
    expect(selectService({ ...original, office: 'miami' }, 'evaluation').office).toBe('miami');
  });
  it('validates contact information before progressing', () => {
    expect(validateStep(initialDraft(), 0)).toMatchObject({ contactName: 'required', email: 'required', phone: 'required', service: 'required' });
    expect(validateStep({ ...contact(), email: 'not-an-email', phone: 'abc123' }, 0)).toMatchObject({ email: 'email', phone: 'phone' });
  });
  it('does not require education fields for translation', () => {
    const draft = { ...contact(), sourceLanguage: 'Chinese', targetLanguage: 'English', translationType: 'certified' };
    expect(validateStep(draft, 1)).toEqual({});
    expect(validateStep({ ...draft, targetLanguage: ' chinese ' }, 1)).toHaveProperty('targetLanguage', 'languages');
  });
  it('validates active education records and chronological dates', () => {
    const draft = { ...initialDraft('pre-evaluation'), firstName: 'Test', lastName: 'Applicant', educations: [{ school: 'Example University', country: 'CN', degree: 'Bachelor', start: '2018-09', end: '2022-06' }, { school: '', country: '', degree: '', start: '', end: '' }] };
    expect(validateStep(draft, 1)).toEqual({});
    expect(validateStep({ ...draft, service: 'evaluation' }, 1)).toHaveProperty('education.1.school');
    expect(validateStep({ ...draft, educations: [{ ...draft.educations[0], end: '2017-06' }] }, 1)).toHaveProperty('education.0.end', 'dateOrder');
  });
  it('restores only current, structurally valid drafts and checks earlier steps', () => {
    const now = Date.now();
    const stored = { version: 1, updatedAt: now, step: 2, data: contact() };
    expect(restoreDraft(JSON.stringify(stored), now)?.step).toBe(1);
    expect(restoreDraft(JSON.stringify({ ...stored, data: { ...contact(), office: 'bj' } }), now)).toMatchObject({ step: 0, data: { office: '', email: 'preview@example.com' } });
    expect(restoreDraft(JSON.stringify({ ...stored, data: initialDraft() }), now)?.step).toBe(0);
    expect(restoreDraft(JSON.stringify({ ...stored, updatedAt: now - 86400001 }), now)).toBeNull();
    expect(restoreDraft(JSON.stringify({ ...stored, step: 3 }), now)).toBeNull();
    expect(restoreDraft('{broken', now)).toBeNull();
  });
  it('accepts only known service query parameters', () => {
    expect(serviceFromQuery('pre-evaluation')).toBe('pre-evaluation');
    expect(serviceFromQuery('translation')).toBe('translation');
    expect(serviceFromQuery(['evaluation', 'translation'])).toBe('');
    expect(serviceFromQuery('unknown')).toBe('');
  });
  it('provides complete nonempty copy in all website languages', () => {
    for (const copy of Object.values(applicationCopy)) {
      expect(Object.keys(copy).sort()).toEqual(Object.keys(applicationCopy.en).sort());
      expect(Object.values(copy).every(value => value.trim().length > 0)).toBe(true);
    }
  });
});
