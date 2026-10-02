import { z } from 'zod';
import { evaluationGroups, evaluationAdditionalDegree, evaluationReports, shipping, type Price, type Turnaround } from '../pricing';

export const serviceIds = ['document', 'course', 'expert', 'position'] as const;
export type ServiceId = typeof serviceIds[number];
export const offices = ['Los Angeles', 'Miami', 'San Francisco'] as const;
export const purposes = ['uscis', 'employment', 'education'] as const;
const text = z.string().trim().max(200);
const addressSchema = z.object({ name: text, country: text, street: text, street2: text, city: text, region: text, postal: text }).strict();
const educationSchema = z.object({ school: text, country: text, degree: text, start: text, end: text }).strict();
const choice = z.object({ tier: text, additionalDegrees: z.number().int().min(0).max(20) }).strict();
export const draftSchema = z.object({
  client: addressSchema.extend({ email: text, phone: text, fax: text, office: z.enum(['', ...offices]), purpose: z.enum(['', ...purposes]) }),
  evaluee: z.object({ title: z.enum(['', 'mr', 'ms', 'mx']), first: text, middle: text, last: text, birth: text }).strict(),
  educations: z.array(educationSchema).max(20),
  services: z.object({ document: choice, course: choice, expert: choice, position: choice, customized: z.boolean(), translation: z.boolean() }).strict(),
  delivery: z.object({ report: z.enum(['pdf', 'paper']), extraCopies: z.number().int().min(0).max(20), shipping: text, sameAddress: z.boolean(), address: addressSchema }).strict(),
  notes: z.string().trim().max(3000),
  terms: z.boolean(),
}).strict();
export type ApplicationData = z.infer<typeof draftSchema>;
export type Education = ApplicationData['educations'][number];
export type Address = ApplicationData['delivery']['address'];
export type FieldError = { path: string; code: string; step: number };
export const emptyAddress = (): Address => ({ name: '', country: '', street: '', street2: '', city: '', region: '', postal: '' });
export const emptyEducation = (): Education => ({ school: '', country: '', degree: '', start: '', end: '' });
export function initialData(): ApplicationData {
  return {
    client: { ...emptyAddress(), email: '', phone: '', fax: '', office: '', purpose: '' },
    evaluee: { title: '', first: '', middle: '', last: '', birth: '' }, educations: [emptyEducation()],
    services: { document: { tier: '', additionalDegrees: 0 }, course: { tier: '', additionalDegrees: 0 }, expert: { tier: '', additionalDegrees: 0 }, position: { tier: '', additionalDegrees: 0 }, customized: false, translation: false },
    delivery: { report: 'pdf', extraCopies: 0, shipping: '', sameAddress: true, address: emptyAddress() }, notes: '', terms: false,
  };
}
const monthValid = (v: string) => /^\d{4}-(0[1-9]|1[0-2])$/.test(v) && v >= '1900-01' && v <= new Date().toISOString().slice(0, 7);
export const isUS = (v: string) => /^(us|usa|unitedstates(ofamerica)?|美国|美國|estadosunidos(deamerica)?)$/.test(v.normalize('NFD').replace(/[\u0300-\u036f.\s]/g, '').toLowerCase());
export function validate(data: ApplicationData, throughStep = 3): FieldError[] {
  const errors: FieldError[] = [];
  const add = (path: string, code: string, step: number) => { if (step <= throughStep) errors.push({ path, code, step }); };
  const required = (v: string, path: string, step: number) => { if (!v.trim()) add(path, 'required', step); };
  const address = (v: Address, prefix: string, step: number) => {
    for (const key of ['name', 'country', 'street', 'city'] as const) required(v[key], `${prefix}.${key}`, step);
    if (isUS(v.country)) {
      required(v.region, `${prefix}.region`, step);
      if (!/^\d{5}(-\d{4})?$/.test(v.postal)) add(`${prefix}.postal`, 'postal', step);
    }
  };
  address(data.client, 'client', 0);
  if (!z.email().safeParse(data.client.email).success) add('client.email', 'email', 0);
  if (data.client.phone.replace(/\D/g, '').length < 7 || !/^[+\d\s().-]+$/.test(data.client.phone)) add('client.phone', 'phone', 0);
  if (data.client.fax && (data.client.fax.replace(/\D/g, '').length < 7 || !/^[+\d\s().-]+$/.test(data.client.fax))) add('client.fax', 'phone', 0);
  required(data.client.office, 'client.office', 0); required(data.client.purpose, 'client.purpose', 0);
  for (const key of ['title', 'first', 'last'] as const) required(data.evaluee[key], `evaluee.${key}`, 1);
  const birth = data.evaluee.birth;
  const parsedBirth = new Date(birth + 'T00:00:00Z');
  if (!/^\d{4}-\d{2}-\d{2}$/.test(birth) || !Number.isFinite(parsedBirth.getTime()) || parsedBirth.toISOString().slice(0, 10) !== birth || birth < '1900-01-01' || birth > new Date().toISOString().slice(0, 10)) add('evaluee.birth', 'birth', 1);
  data.educations.forEach((edu, i) => {
    const prefix = `educations.${i}`;
    for (const key of ['school', 'country', 'degree'] as const) required(edu[key], `${prefix}.${key}`, 1);
    for (const key of ['start', 'end'] as const) if (!monthValid(edu[key])) add(`${prefix}.${key}`, 'month', 1);
    if (edu.start > edu.end) add(`${prefix}.end`, 'order', 1);
  });
  if (!serviceIds.some(id => data.services[id].tier) && !data.services.customized) add('services', 'service', 2);
  if (['document', 'course', 'expert'].some(id => data.services[id as ServiceId].tier) && !data.educations.length) add('services', 'education', 2);
  for (const id of serviceIds) {
    const selected = data.services[id];
    if (selected.tier && !evaluationGroups.find(g => g.id === id)!.rates.some(r => r.id === selected.tier)) add(`services.${id}.tier`, 'tier', 2);
    if (selected.additionalDegrees && (!selected.tier || !['document', 'course'].includes(id) || selected.additionalDegrees >= data.educations.length)) add(`services.${id}.additionalDegrees`, 'degrees', 2);
  }
  if (data.services.customized && !data.notes.trim()) add('notes', 'details', 2);
  if (data.delivery.report === 'pdf') {
    if (data.delivery.shipping || data.delivery.extraCopies) add('delivery.report', 'delivery', 2);
  } else {
    if (!data.delivery.sameAddress) address(data.delivery.address, 'delivery.address', 2);
    const destination = data.delivery.sameAddress ? data.client : data.delivery.address;
    const rate = shipping.find(r => r.id === data.delivery.shipping);
    if (!rate || (isUS(destination.country) !== rate.id.startsWith('domestic'))) add('delivery.shipping', 'shipping', 2);
  }
  if (!data.terms) add('terms', 'terms', 3);
  return errors;
}
export const applicationSchema = draftSchema.superRefine((data, context) => {
  for (const error of validate(data)) context.addIssue({ code: 'custom', message: error.code, path: error.path.split('.').map(p => /^\d+$/.test(p) ? Number(p) : p) });
});
export type QuoteLine = { id: string; quantity: number; min: number; max: number; tier?: string; turnaround?: Turnaround };
export type Quote = { currency: 'USD'; lines: QuoteLine[]; min: number; max: number; needsQuote: boolean };
/** Pure calculation used by the form and server. Never accept totals from clients. */
export function quote(data: ApplicationData): Quote {
  const lines: QuoteLine[] = [];
  const add = (id: string, price: Price, quantity = 1, tier?: string, turnaround?: Turnaround) => {
    if (!quantity) return;
    if (price.kind !== 'fixed' && price.kind !== 'range') throw new Error('Unsupported application rate');
    const min = Math.round((price.kind === 'range' ? price.min : price.amount) * 100) * quantity;
    const max = Math.round((price.kind === 'range' ? price.max : price.amount) * 100) * quantity;
    lines.push({ id, quantity, min, max, ...(tier ? { tier } : {}), ...(turnaround ? { turnaround } : {}) });
  };
  for (const group of evaluationGroups) {
    const selected = data.services[group.id];
    if (!selected.tier) continue;
    const rate = group.rates.find(r => r.id === selected.tier);
    if (!rate) throw new Error('Unknown rate');
    add(group.id, rate.price, 1, rate.id, rate.turnaround);
    if (group.id === 'document' || group.id === 'course') add(`${group.id}Additional`, { kind: 'fixed', amount: evaluationAdditionalDegree[group.id] }, selected.additionalDegrees);
  }
  add(`report${data.delivery.report === 'pdf' ? 'Pdf' : 'Paper'}`, evaluationReports.find(r => r.id === data.delivery.report)!.price);
  if (data.delivery.report === 'paper') {
    add('reportExtra', evaluationReports.find(r => r.id === 'extraCopy')!.price, data.delivery.extraCopies);
    if (data.delivery.shipping) {
      const rate = shipping.find(r => r.id === data.delivery.shipping);
      if (!rate) throw new Error('Unknown shipping');
      add(rate.id, rate.price);
    }
  }
  return { currency: 'USD', lines, min: lines.reduce((sum, l) => sum + l.min, 0), max: lines.reduce((sum, l) => sum + l.max, 0), needsQuote: data.services.customized || data.services.translation || lines.some(l => l.min !== l.max) };
}
export function shippingOptions(country: string) { return shipping.filter(r => r.id.startsWith(isUS(country) ? 'domestic' : 'international')); }
