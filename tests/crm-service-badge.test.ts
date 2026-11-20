import { describe, expect, it } from 'vitest';
import { initialData } from '../lib/evaluation-application/domain';
import { serviceBadgeLabel } from '../lib/crm/service-badge';

describe('CRM service badge', () => {
  it('presents formal selections and historical summaries in the same order', () => {
    const services = initialData().services;
    services.document.tier = 'rush';
    services.course.tier = 'standard';
    services.expert.tier = 'standard';
    services.position.tier = 'standard';
    services.customized = true;
    services.translation = true;
    const expected = 'Document by Document, Course by Course, Expert Opinion Letter, Position Evaluation, Translation, Customized Evaluation';
    expect(serviceBadgeLabel(services)).toBe(expected);
    expect(serviceBadgeLabel('Translation, Position Evaluation, Document by Document, Other, Course by Course, Expert Opinion Letter, Translation, Customized Evaluation')).toBe(expected);
  });
  it('accepts pre-evaluation and falls back only for unrecognized or empty selections', () => {
    expect(serviceBadgeLabel('Pre-Evaluation')).toBe('Pre-Evaluation');
    expect(serviceBadgeLabel('Unknown, Translation')).toBe('Translation');
    expect(serviceBadgeLabel('Formal evaluation')).toBe('FCE');
    expect(serviceBadgeLabel(undefined)).toBe('FCE');
    expect(serviceBadgeLabel(initialData().services)).toBe('FCE');
  });
});
