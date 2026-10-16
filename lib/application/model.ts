import { z } from 'zod';
import { isCountryCode } from '@/lib/legacy-application/countries';

export const serviceIds = ['pre-evaluation', 'evaluation', 'translation'] as const;
export type ServiceId = typeof serviceIds[number];
export const serviceFromQuery = (value: unknown): ServiceId | '' =>
  typeof value === 'string' && serviceIds.includes(value as ServiceId) ? value as ServiceId : '';

const text = z.string().max(300);
// Owner-approved routing: evaluation in Miami/California; translation in five US offices.
export const serviceOffices: Record<ServiceId, readonly string[]> = {
  'pre-evaluation': ['miami', 'la', 'sf'], evaluation: ['miami', 'la', 'sf'], translation: ['miami', 'boston', 'la', 'sf', 'nyc'],
};
const educationSchema = z.object({ school: text, country: text, degree: text, start: text, end: text });
export const dataSchema = z.object({
  contactName: text, email: text, phone: text, service: z.enum(['', ...serviceIds]), office: text,
  firstName: text, middleName: text, lastName: text, purpose: text, evaluationType: text,
  educations: z.array(educationSchema).min(1).max(10),
  sourceLanguage: text, targetLanguage: text, translationType: text,
  notes: z.string().max(3000),
});
export type ApplicationDraft = z.infer<typeof dataSchema>;
export type EducationDraft = ApplicationDraft['educations'][number];
export type FormErrors = Record<string, 'required' | 'email' | 'phone' | 'date' | 'dateOrder' | 'country' | 'languages' | 'office'>;
export const emptyEducation = (): EducationDraft => ({ school: '', country: '', degree: '', start: '', end: '' });
export const initialDraft = (service: ServiceId | '' = ''): ApplicationDraft => ({
  contactName: '', email: '', phone: '', service, office: '',
  firstName: '', middleName: '', lastName: '', purpose: '', evaluationType: '',
  educations: [emptyEducation()], sourceLanguage: '', targetLanguage: '', translationType: '', notes: '',
});
export function selectService(data: ApplicationDraft, service: ServiceId): ApplicationDraft {
  return { ...data, service, office: serviceOffices[service].includes(data.office) ? data.office : '' };
}
export function validateStep(data: ApplicationDraft, step: number): FormErrors {
  const errors: FormErrors = {};
  const required = (key: string, value: string) => { if (!value.trim()) errors[key] = 'required'; };
  if (step === 0) {
    for (const key of ['contactName', 'email', 'phone', 'service'] as const) required(key, data[key]);
    if (data.email.trim() && !z.email().safeParse(data.email.trim()).success) errors.email = 'email';
    if (data.phone.trim() && (!/^[+\d\s().-]+$/.test(data.phone) || !/^\d{7,15}$/.test(data.phone.replace(/\D/g, '')))) errors.phone = 'phone';
    if (data.service && serviceOffices[data.service].length && !serviceOffices[data.service].includes(data.office)) errors.office = 'office';
  }
  if (step === 1) {
    if (data.service === 'translation') {
      for (const key of ['sourceLanguage', 'targetLanguage', 'translationType'] as const) required(key, data[key]);
      if (data.sourceLanguage.trim() && data.sourceLanguage.trim().toLocaleLowerCase() === data.targetLanguage.trim().toLocaleLowerCase()) errors.targetLanguage = 'languages';
    } else if (data.service) {
      required('firstName', data.firstName); required('lastName', data.lastName);
      const educations = data.service === 'pre-evaluation' ? data.educations.slice(0, 1) : data.educations;
      educations.forEach((education, index) => {
        const path = (field: keyof EducationDraft) => `education.${index}.${field}`;
        for (const field of ['school', 'country', 'degree', 'start', 'end'] as const) required(path(field), education[field]);
        if (education.country && !isCountryCode(education.country)) errors[path('country')] = 'country';
        for (const field of ['start', 'end'] as const) {
          if (education[field] && !/^(19|20)\d{2}-(0[1-9]|1[0-2])$/.test(education[field])) errors[path(field)] = 'date';
        }
        if (!errors[path('start')] && !errors[path('end')] && education.start > education.end) errors[path('end')] = 'dateOrder';
      });
      if (data.service === 'evaluation') { required('evaluationType', data.evaluationType); required('purpose', data.purpose); }
    }
  }
  return errors;
}

export const DRAFT_KEY = 'aet-general-application-preview-v1';
const storedDraft = z.object({ version: z.literal(1), updatedAt: z.number(), step: z.number().int().min(0).max(2), data: dataSchema });
export function restoreDraft(raw: string, now = Date.now()) {
  try {
    const result = storedDraft.safeParse(JSON.parse(raw));
    if (!result.success || now - result.data.updatedAt > 86400000 || result.data.updatedAt > now + 60000) return null;
    const saved = result.data;
    if (saved.data.service) saved.data = selectService(saved.data, saved.data.service);
    // Never restore a later step past invalid or incomplete answers.
    for (let step = 0; step < Math.min(saved.step, 2); step++) {
      if (Object.keys(validateStep(saved.data, step)).length) return { ...saved, step };
    }
    return saved;
  } catch { return null; }
}
