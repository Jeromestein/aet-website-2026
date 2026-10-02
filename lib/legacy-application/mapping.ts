import type { ApplicationData, Quote } from '../evaluation-application/domain';
import type { ApplicationInput } from '../preeval/domain';

export const serviceKeys = { document: 'foreignCredentialEvaluation', course: 'coursebyCourse', expert: 'professionalExperience', position: 'positionEvaluation' } as const;
// Codes express actual turnaround. Never encode website 14/8 days as legacy 7/3 days.
export const speeds: Record<string, Record<string, string>> = {
  document: { standard: '7day', rush: '3day', nextDay: '24hour', sameDay: 'sameday' },
  course: { standard: '8day', rush: '5day', express: '3day', nextDay: '24hour' },
  expert: { standard: '21day', rush: '14day', express: '8day' },
  position: { standard: '10day', rush: '5day', express: '3day', priority: '2day' },
};
export const shippingCodes: Record<string, string> = {
  '': 'no_delivery_needed', domesticFirst: 'usps_first_class_domestic', domesticPriority: 'usps_priority_domestic',
  domesticExpress: 'usps_express_domestic', internationalFirst: 'usps_first_class_international',
  internationalExpress: 'usps_express_international', internationalFedex: 'fedex_express_international',
};
export const reportCodes = { pdf: 'pdf_only', paper: 'pdf_with_hard_copy', extraCopy: 'extra_copy' } as const;
export function monthParts(value: string) { const [year, month] = value.split('-'); return { month, year }; }
export function toLegacyEducation(education: ApplicationData['educations'][number]) {
  return { school_name: education.school, country_of_study: education.country, degree_obtained: education.degree,
    study_start_date: monthParts(education.start), study_end_date: monthParts(education.end) };
}
export function toLegacyPreeval(input: ApplicationInput) {
  return {
    application: { first_name: input.firstName, middle_name: input.middleName || null, last_name: input.lastName, email: input.email, purpose: 'degree-equivalency', source: null, status: 'submitted' },
    education: toLegacyEducation({ school: input.schoolName, country: input.countryOfStudy, degree: input.degreeObtained, start: input.startDate, end: input.endDate }),
  };
}
export function toLegacyFormal(data: ApplicationData, quote: Quote) {
  const service_type: Record<string, unknown> = { customizedService: { required: data.services.customized }, translation: { required: data.services.translation } };
  for (const [key, legacyKey] of Object.entries(serviceKeys)) {
    const choice = data.services[key as keyof typeof serviceKeys];
    const speed = choice.tier ? speeds[key][choice.tier] : undefined;
    if (choice.tier && !speed) throw new Error('Unsupported service tier');
    service_type[legacyKey] = key === 'document' || key === 'course'
      ? { firstDegree: speed ? { speed } : {}, secondDegrees: choice.additionalDegrees }
      : speed ? { speed } : {};
  }
  // Optional JSON metadata: no column migration, immutable website prices for readers.
  service_type.websiteQuote = { version: 1, ...quote };
  return {
    status: 'submitted', current_step: 3,
    name: data.client.name, country: data.client.country, street_address: data.client.street, street_address2: data.client.street2 || null,
    city: data.client.city, region: data.client.region, zip_code: data.client.postal, phone: data.client.phone, fax: data.client.fax || null,
    email: data.client.email, office: data.client.office, purpose: `evaluation-${data.client.purpose}`, purpose_other: data.notes || null,
    pronouns: data.evaluee.title, first_name: data.evaluee.first, middle_name: data.evaluee.middle || null, last_name: data.evaluee.last, date_of_birth: data.evaluee.birth,
    service_type, delivery_method: shippingCodes[data.delivery.shipping], additional_services: [reportCodes[data.delivery.report]],
    additional_services_quantity: { pdf_only: 0, pdf_with_hard_copy: 0, extra_copy: data.delivery.report === 'extraCopy' ? data.delivery.extraCopies : 0 },
    payment_status: 'pending', payment_id: null, paid_at: null, due_amount: quote.needsQuote ? null : (quote.min / 100).toFixed(2),
  };
}

/** Read stored business fields without recalculating historical fees. */
export function fromLegacyFormal(row: Record<string, any>, educations: Record<string, any>[], original: ApplicationData): ApplicationData {
  const data = structuredClone(original);
  data.client = { name: row.name, country: row.country, street: row.street_address, street2: row.street_address2 || '', city: row.city, region: row.region, postal: row.zip_code,
    email: row.email, phone: row.phone, fax: row.fax || '', office: row.office, purpose: row.purpose.replace(/^evaluation-/, '') };
  data.evaluee = { title: row.pronouns, first: row.first_name, middle: row.middle_name || '', last: row.last_name,
    birth: row.date_of_birth instanceof Date ? row.date_of_birth.toISOString().slice(0, 10) : String(row.date_of_birth).slice(0, 10) };
  data.educations = educations.map(education => ({ school: education.school_name, country: education.country_of_study, degree: education.degree_obtained,
    start: `${education.study_start_date.year}-${education.study_start_date.month}`, end: `${education.study_end_date.year}-${education.study_end_date.month}` }));
  data.notes = row.purpose_other || '';
  for (const [key, legacyKey] of Object.entries(serviceKeys)) {
    const stored = row.service_type[legacyKey];
    const speed = key === 'document' || key === 'course' ? stored?.firstDegree?.speed : stored?.speed;
    const tier = Object.entries(speeds[key]).find(([, value]) => value === speed)?.[0];
    if (speed && !tier) throw new Error('Legacy service requires its original reader; refusing to reinterpret turnaround');
    data.services[key as keyof typeof serviceKeys] = { tier: tier || '', additionalDegrees: stored?.secondDegrees || 0 };
  }
  data.services.translation = !!row.service_type.translation?.required;
  data.services.customized = !!row.service_type.customizedService?.required;
  const reports = row.additional_services || [];
  if (reports.length !== 1 || !Object.values(reportCodes).includes(reports[0])) throw new Error('Unsupported historical report combination');
  const report = Object.entries(reportCodes).find(([, value]) => value === reports[0])![0] as ApplicationData['delivery']['report'];
  const shipping = Object.entries(shippingCodes).find(([, value]) => value === row.delivery_method)?.[0];
  if (shipping === undefined) throw new Error('Unsupported historical shipping option');
  data.delivery = { ...data.delivery, report, extraCopies: report === 'extraCopy' ? row.additional_services_quantity?.extra_copy || 0 : 0, shipping };
  return data;
}
