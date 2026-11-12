import { z } from 'zod';
import { dataSchema, validateStep } from './model';
import { applicationSchema, AppError } from '../preeval/domain';

const unifiedSubmission = z.object({
  requestId: z.uuid(), locale: z.enum(['en', 'zh', 'es']), data: dataSchema.strict(),
}).strict();

/** Map the unified form to the existing pre-evaluation lifecycle, without a second application. */
export function preEvaluationInput(raw: unknown) {
  const parsed = unifiedSubmission.safeParse(raw);
  if (!parsed.success) throw new AppError('invalid_application');
  const { data, locale, requestId } = parsed.data;
  if (data.service !== 'pre-evaluation' || [0, 1, 2].some(step => Object.keys(validateStep(data, step)).length))
    throw new AppError('invalid_application');
  const education = data.educations[0];
  const input = applicationSchema.safeParse({
    requestId, locale, email: data.email.trim(), firstName: data.firstName,
    middleName: data.middleName, lastName: data.lastName, country: data.residenceCountry,
    schoolName: education.school, countryOfStudy: education.country, degreeObtained: education.degree,
    startDate: education.start, endDate: education.end, terms: data.preevaluationTerms, uploadsPending: true,
    unified: { contactName: data.contactName, phone: data.phone, office: data.office,
      pronouns: data.pronouns, dateOfBirth: data.dateOfBirth, notes: data.notes },
  });
  if (!input.success) throw new AppError('invalid_application');
  return input.data;
}
