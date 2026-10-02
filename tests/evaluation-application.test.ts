import { describe, expect, it } from 'vitest';
import { applicationSchema, initialData, validate, quote, shippingOptions } from '../lib/evaluation-application/domain';
import { evaluationGroups, evaluationAdditionalDegree, evaluationReports, evaluationExtraCopy, shipping } from '../lib/pricing';

export function fixture() {
  const data = initialData();
  data.client = { ...data.client, name: 'Fictional Application Test', email: 'evaluation-test@example.test', phone: '+1 202 555 0149', office: 'Miami', purpose: 'education', country: 'United States', street: '123 Test Street', city: 'Miami', region: 'FL', postal: '33101' };
  data.evaluee = { title: 'mx', first: 'Sample', middle: '', last: 'Applicant', birth: '1995-02-28' };
  data.educations = [{ school: 'Fictional University', degree: 'Bachelor of Science', country: 'Canada', start: '2013-09', end: '2017-06' }];
  data.services.document.tier = 'standard'; data.terms = true;
  return data;
}
describe('formal evaluation validation', () => {
  it('accepts a complete application', () => expect(applicationSchema.safeParse(fixture()).success).toBe(true));
  it('blocks empty required data and step skipping', () => {
    expect(validate(initialData(), 0).every(e => e.step === 0)).toBe(true);
    expect(new Set(validate(initialData()).map(e => e.step))).toEqual(new Set([0, 1, 2, 3]));
  });
  it('rejects whitespace-only names', () => { const d = fixture(); d.evaluee.first = '   '; expect(applicationSchema.safeParse(d).success).toBe(false); });
  it.each(['1995-02-30', '2025-02-29', '2999-01-01', '1899-01-01'])('rejects invalid birthday %s', birth => { const d = fixture(); d.evaluee.birth = birth; expect(validate(d).some(e => e.path === 'evaluee.birth')).toBe(true); });
  it('accepts leap day', () => { const d = fixture(); d.evaluee.birth = '2000-02-29'; expect(validate(d)).toEqual([]); });
  it('rejects reversed study dates', () => { const d = fixture(); d.educations[0].start = '2020-01'; expect(validate(d).some(e => e.code === 'order')).toBe(true); });
  it('rejects invalid months and future education dates', () => { const d = fixture(); d.educations[0].start = '2020-13'; d.educations[0].end = '2999-01'; expect(validate(d).filter(e => e.code === 'month')).toHaveLength(2); });
  it('accepts international phones and postal codes', () => { const d = fixture(); d.client.country = 'Canada'; d.client.postal = 'M5V 2T6'; d.client.phone = '+1 (416) 555-0199'; expect(validate(d)).toEqual([]); });
  it('allows regions and postal codes to be absent outside the US', () => { const d = fixture(); d.client.country = 'Hong Kong'; d.client.region = ''; d.client.postal = ''; expect(validate(d)).toEqual([]); });
  it('enforces US address fields', () => { const d = fixture(); d.client.region = ''; d.client.postal = 'bad'; expect(validate(d).map(e => e.path)).toEqual(['client.region', 'client.postal']); });
  it('requires education for academic evaluation but not position evaluation', () => { const d = fixture(); d.educations = []; expect(validate(d).some(e => e.code === 'education')).toBe(true); d.services.document.tier = ''; d.services.position.tier = 'standard'; expect(validate(d)).toEqual([]); });
  it('requires details for custom-only requests', () => { const d = fixture(); d.services.document.tier = ''; d.services.customized = true; expect(validate(d).some(e => e.code === 'details')).toBe(true); d.notes = 'Assess requirements for a fictional position.'; expect(validate(d)).toEqual([]); expect(quote(d).needsQuote).toBe(true); });
  it('rejects a removed or invented price tier', () => { const d = fixture(); d.services.course.tier = 'sameday'; expect(applicationSchema.safeParse(d).success).toBe(false); expect(() => quote(d)).toThrow('Unknown rate'); });
  it('rejects extra degrees without enough education entries or a base service', () => { const d = fixture(); d.services.document.additionalDegrees = 1; expect(validate(d).some(e => e.code === 'degrees')).toBe(true); d.educations.push({ ...d.educations[0] }); expect(validate(d)).toEqual([]); d.services.document.tier = ''; expect(validate(d).some(e => e.code === 'degrees')).toBe(true); });
  it('rejects fractional, negative and oversized quantities', () => { for (const n of [-1, 0.5, 21]) { const d = fixture(); d.services.document.additionalDegrees = n; expect(applicationSchema.safeParse(d).success).toBe(false); } });
  it('requires terms acceptance', () => { const d = fixture(); d.terms = false; expect(validate(d).some(e => e.code === 'terms')).toBe(true); });
  it('rejects client-injected prices and extra properties', () => { expect(applicationSchema.safeParse({ ...fixture(), total: 1 }).success).toBe(false); const d = fixture(); expect(applicationSchema.safeParse({ ...d, services: { ...d.services, free: true } }).success).toBe(false); });
});
describe('shared website rates', () => {
  for (const group of evaluationGroups) for (const rate of group.rates) {
    it(`uses website price for ${group.id}/${rate.id}`, () => {
      const d = fixture(); d.services.document.tier = ''; d.services[group.id].tier = rate.id;
      expect(rate.price.kind).toBe('fixed');
      if (rate.price.kind !== 'fixed') throw new Error('Expected fixed rate');
      expect(quote(d).lines.find(l => l.id === group.id)?.min).toBe(rate.price.amount * 100);
    });
  }
  it('charges all selected services and additional degrees once', () => {
    const d = fixture(); d.educations.push({ ...d.educations[0] }); d.services.course.tier = 'standard'; d.services.document.additionalDegrees = 1; d.services.course.additionalDegrees = 1;
    expect(quote(d).min).toBe((100 + 180 + evaluationAdditionalDegree.document + evaluationAdditionalDegree.course + 10) * 100);
  });
  it('retains the published extra-copy range instead of inventing an exact fee', () => {
    const d = fixture(); d.delivery.report = 'paper'; d.delivery.extraCopies = 2; d.delivery.shipping = 'domesticFirst';
    expect(quote(d)).toMatchObject({ min: 21000, max: 25000, needsQuote: true });
    expect(evaluationReports.find(r => r.id === 'extraCopy')?.price).toBe(evaluationExtraCopy);
  });
  it.each(shipping.map(r => [r.id, r.price]))('uses website shipping fee for %s', (id, price) => {
    const d = fixture(); d.delivery.report = 'paper'; d.delivery.shipping = String(id);
    if (typeof price === 'string' || price.kind !== 'fixed') throw new Error('Expected fixed shipping');
    expect(quote(d).lines.find(l => l.id === id)?.min).toBe(price.amount * 100);
  });
  it('does not treat translation as a zero-dollar confirmed quote', () => { const d = fixture(); d.services.translation = true; expect(quote(d).needsQuote).toBe(true); });
  it('validates shipping against a separate recipient country', () => { const d = fixture(); d.delivery.report = 'paper'; d.delivery.sameAddress = false; d.delivery.address = { name: 'Test Recipient', street: '123 Fictional Lane', street2: '', country: 'Canada', city: 'Toronto', region: 'ON', postal: 'M5V 2T6' }; d.delivery.shipping = 'domesticFirst'; expect(validate(d).some(e => e.code === 'shipping')).toBe(true); d.delivery.shipping = 'internationalExpress'; expect(validate(d)).toEqual([]); });
  it('rejects mailing on PDF-only orders', () => { const d = fixture(); d.delivery.shipping = 'domesticFirst'; expect(validate(d).some(e => e.code === 'delivery')).toBe(true); });
  it('offers current website shipping options for each destination', () => { expect(shippingOptions('美国').map(r => r.id)).toEqual(['domesticFirst', 'domesticPriority', 'domesticExpress']); expect(shippingOptions('Canada').map(r => r.id)).toEqual(['internationalFirst', 'internationalExpress', 'internationalFedex']); });
  it.each(['U.S.', 'U.S.A.', 'Estados Unidos de América', '美国', ' US '])('recognizes US destination %s', country => { expect(shippingOptions(country).every(r => r.id.startsWith('domestic'))).toBe(true); });
});
