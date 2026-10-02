import { describe, it, expect } from 'vitest';
import { confirmQuote } from '../lib/evaluation-application/workflow';
import { randomUUID } from 'node:crypto';
import { initialData, quote, applicationSchema } from '../lib/evaluation-application/domain';
import { toLegacyFormal, fromLegacyFormal, toLegacyPreeval, toLegacyEducation } from '../lib/legacy-application/mapping';
import { isCountryCode, regionOptions } from '../lib/legacy-application/countries';
function fixture() {
  const data = initialData();
  Object.assign(data.client, { name: 'Fictional Test', country: 'US', street: '123 Test Street', city: 'Miami', region: 'FL', postal: '33101', phone: '202-555-0149', email: 'synthetic@example.test', office: 'Miami', purpose: 'education' });
  data.evaluee = { title: 'mx', first: 'Sample', middle: 'Test', last: 'Applicant', birth: '1990-01-02' };
  data.educations = [{ school: 'Fictional University', country: 'CA', degree: 'BSc', start: '2008-09', end: '2012-06' }];
  data.notes = 'Synthetic compatibility test'; data.services.document.tier = 'standard'; data.terms = true;
  return data;
}
describe('existing application contracts', () => {
  it('round-trips every client, evaluee and education field without losing notes', () => {
    const data = fixture(), row = toLegacyFormal(data, quote(data));
    expect(fromLegacyFormal(row, data.educations.map(toLegacyEducation), initialData())).toEqual({ ...data, terms: false });
    expect(row).toMatchObject({ purpose: 'evaluation-education', pronouns: 'mx', middle_name: 'Test', purpose_other: data.notes, payment_status: 'pending', due_amount: '110.00' });
  });
  it('stores dates as the original month/year object', () => expect(toLegacyEducation(fixture().educations[0]).study_start_date).toEqual({ month: '09', year: '2008' }));
  it.each(['pdf','paper','extraCopy'] as const)('preserves independent legacy report selection %s', report => {
    const data = fixture(); data.delivery.report = report; data.delivery.shipping = report === 'pdf' ? '' : 'domesticFirst'; data.delivery.extraCopies = report === 'extraCopy' ? 2 : 0;
    expect(applicationSchema.safeParse(data).success).toBe(true);
    const row = toLegacyFormal(data, quote(data));
    expect(row.additional_services).toHaveLength(1);
    expect(fromLegacyFormal(row, data.educations.map(toLegacyEducation), initialData()).delivery).toEqual(data.delivery);
    if (report === 'extraCopy') { expect(quote(data).min).toBe(19000); expect(row.due_amount).toBeNull(); expect(quote(data).lines.some(l => l.id === 'reportPaper')).toBe(false); }
  });
  it('stores the real website expert turnaround and retains an immutable quote', () => {
    const data = fixture(); data.services.document.tier = ''; data.services.expert.tier = 'rush';
    const row = toLegacyFormal(data, quote(data));
    expect(row.service_type.professionalExperience).toEqual({ speed: '14day' });
    expect(row.service_type.websiteQuote).toMatchObject({ version: 1, min: 71000 });
  });
  it('does not reinterpret historical 7-day expert orders as new 14-day service', () => {
    const data = fixture(), row = toLegacyFormal(data, quote(data)); row.service_type.professionalExperience = { speed: '7day' };
    expect(() => fromLegacyFormal(row, [], initialData())).toThrow(/refusing/);
  });
  it('matches pre-evaluation core fields and keeps absent optional name null', () => {
    const value = { requestId: randomUUID(), locale: 'en' as const, email: 'test@example.test', firstName: 'Sample', middleName: '', lastName: 'Test', country: 'US', schoolName: 'Fictional College', countryOfStudy: 'CN', degreeObtained: 'Bachelor', startDate: '2010-09', endDate: '2014-06', terms: true as const };
    const mapped = toLegacyPreeval(value);
    expect(mapped.application).toEqual({ first_name: 'Sample', middle_name: null, last_name: 'Test', email: value.email, purpose: 'degree-equivalency', source: null, status: 'submitted' });
    expect(mapped.education.country_of_study).toBe('CN');
  });
  it('uses legacy country/region codes', () => { expect(isCountryCode('US')).toBe(true); expect(isCountryCode('美国')).toBe(false); expect(regionOptions('US')).toContainEqual({ value: 'FL', label: 'Florida' }); });
  it('rejects a confirmed quote outside the existing numeric(6,2) column', () => {
    const data = fixture(); data.services.customized = true;
    expect(() => confirmQuote(quote(data), data, 11000, 989000, 'Synthetic quote')).toThrow();
    expect(confirmQuote(quote(data), data, 11000, 988999, 'Synthetic quote').total).toBe(999999);
  });
});
